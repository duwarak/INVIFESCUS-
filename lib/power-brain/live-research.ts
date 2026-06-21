export interface ResearchHit {
  source: "openalex" | "wikipedia" | "arxiv";
  title: string;
  url: string;
  snippet: string;
  authors?: string[];
  year?: number;
  citationCount?: number;
  doi?: string;
  id?: string;
}

export interface ResearchResult {
  query: string;
  ts: number;
  hits: ResearchHit[];
  summary: string;
  bySource: { openalex: number; wikipedia: number; arxiv: number };
  errors: { source: string; message: string }[];
}

interface CacheEntry {
  ts: number;
  result: ResearchResult;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

const UA = "Polymath-PowerBrain/1.0 (research client)";

async function timedFetch(
  url: string,
  init?: RequestInit,
  timeoutMs = 6000
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "User-Agent": UA, ...(init?.headers ?? {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchOpenAlex(q: string): Promise<{ hits: ResearchHit[]; err?: string }> {
  try {
    const u = `https://api.openalex.org/works?search=${encodeURIComponent(q)}&per_page=5&select=id,title,doi,publication_year,cited_by_count,authorships,abstract_inverted_index`;
    const r = await timedFetch(u);
    if (!r.ok) return { hits: [], err: `openalex ${r.status}` };
    const j = (await r.json()) as { results?: any[] };
    const results = j.results ?? [];
    const hits: ResearchHit[] = results.map((w: any) => {
      const authors: string[] = (w.authorships ?? [])
        .slice(0, 4)
        .map((a: any) => a.author?.display_name)
        .filter(Boolean);
      let snippet = "";
      if (w.abstract_inverted_index) {
        const inv = w.abstract_inverted_index as Record<string, number[]>;
        const words: string[] = [];
        for (const [word, positions] of Object.entries(inv)) {
          for (const p of positions) words[p] = word;
        }
        snippet = words.filter(Boolean).slice(0, 60).join(" ");
      }
      return {
        source: "openalex",
        title: w.title ?? "Untitled",
        url: w.doi ? `https://doi.org/${String(w.doi).replace("https://doi.org/", "")}` : w.id ?? "",
        snippet: snippet || `Cited ${w.cited_by_count ?? 0} times.`,
        authors,
        year: w.publication_year,
        citationCount: w.cited_by_count,
        doi: w.doi ?? undefined,
        id: w.id,
      };
    });
    return { hits };
  } catch (e: any) {
    return { hits: [], err: `openalex ${e?.message ?? "fetch failed"}` };
  }
}

async function fetchWikipedia(q: string): Promise<{ hits: ResearchHit[]; err?: string }> {
  try {
    const search = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=3&origin=*&search=${encodeURIComponent(q)}`;
    const r = await timedFetch(search);
    if (!r.ok) return { hits: [], err: `wikipedia search ${r.status}` };
    const arr = (await r.json()) as any[];
    const titles: string[] = arr[1] ?? [];
    const urls: string[] = arr[3] ?? [];

    const hits = await Promise.all(
      titles.slice(0, 3).map(async (title, i): Promise<ResearchHit | null> => {
        try {
          const sr = await timedFetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
              title.replace(/ /g, "_")
            )}`
          );
          if (!sr.ok) return null;
          const sj = (await sr.json()) as { extract?: string; content_urls?: any; titles?: any };
          return {
            source: "wikipedia",
            title,
            url:
              sj.content_urls?.desktop?.page ??
              urls[i] ??
              `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
            snippet: stripTags(sj.extract ?? "").slice(0, 360),
          };
        } catch {
          return null;
        }
      })
    );
    return { hits: hits.filter(Boolean) as ResearchHit[] };
  } catch (e: any) {
    return { hits: [], err: `wikipedia ${e?.message ?? "fetch failed"}` };
  }
}

async function fetchArxiv(q: string): Promise<{ hits: ResearchHit[]; err?: string }> {
  try {
    const u = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&start=0&max_results=4&sortBy=relevance&sortOrder=descending`;
    const r = await timedFetch(u, undefined, 8000);
    if (!r.ok) return { hits: [], err: `arxiv ${r.status}` };
    const xml = await r.text();
    const entries = xml.split("<entry>").slice(1);
    const hits: ResearchHit[] = entries.slice(0, 4).map((entry) => {
      const grab = (tag: string): string => {
        const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return m ? stripTags(m[1]) : "";
      };
      const link =
        (entry.match(/<id>([^<]+)<\/id>/) ?? [])[1] ?? "";
      const authors = Array.from(entry.matchAll(/<name>([^<]+)<\/name>/g)).map(
        (m) => m[1]
      );
      const published = (entry.match(/<published>([^<]+)<\/published>/) ?? [])[1] ?? "";
      const year = published ? Number(published.slice(0, 4)) : undefined;
      return {
        source: "arxiv",
        title: grab("title"),
        url: link,
        snippet: grab("summary").slice(0, 360),
        authors: authors.slice(0, 4),
        year,
        id: link,
      };
    });
    return { hits };
  } catch (e: any) {
    return { hits: [], err: `arxiv ${e?.message ?? "fetch failed"}` };
  }
}

function synthesize(query: string, hits: ResearchHit[]): string {
  if (!hits.length) {
    return `No live sources surfaced for "${query}" right now — try a more specific term, or wait for the open APIs to reload.`;
  }
  const wiki = hits.find((h) => h.source === "wikipedia");
  const openalexTop = hits
    .filter((h) => h.source === "openalex")
    .sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0))[0];
  const arxivTop = hits.find((h) => h.source === "arxiv");

  const pieces: string[] = [];
  if (wiki && wiki.snippet) {
    pieces.push(`Encyclopedic frame — ${wiki.snippet}`);
  }
  if (openalexTop) {
    pieces.push(
      `Scholarly anchor — "${openalexTop.title}"${openalexTop.year ? ` (${openalexTop.year})` : ""}${openalexTop.authors?.length ? ` by ${openalexTop.authors.slice(0, 2).join(", ")}` : ""}, cited ${openalexTop.citationCount ?? 0}×. ${openalexTop.snippet.slice(0, 220)}`
    );
  }
  if (arxivTop) {
    pieces.push(
      `Recent preprint — "${arxivTop.title}"${arxivTop.year ? ` (${arxivTop.year})` : ""}. ${arxivTop.snippet.slice(0, 200)}`
    );
  }
  return pieces.join(" ");
}

export async function liveResearch(query: string): Promise<ResearchResult> {
  const key = query.toLowerCase().trim();
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.result;
  }

  const [oa, wp, ax] = await Promise.all([
    fetchOpenAlex(query),
    fetchWikipedia(query),
    fetchArxiv(query),
  ]);
  const hits = [...wp.hits, ...oa.hits, ...ax.hits];
  const errors: { source: string; message: string }[] = [];
  if (oa.err) errors.push({ source: "openalex", message: oa.err });
  if (wp.err) errors.push({ source: "wikipedia", message: wp.err });
  if (ax.err) errors.push({ source: "arxiv", message: ax.err });

  const result: ResearchResult = {
    query,
    ts: Date.now(),
    hits,
    summary: synthesize(query, hits),
    bySource: {
      openalex: oa.hits.length,
      wikipedia: wp.hits.length,
      arxiv: ax.hits.length,
    },
    errors,
  };
  CACHE.set(key, { ts: Date.now(), result });
  return result;
}
