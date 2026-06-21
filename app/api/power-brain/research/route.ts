import { NextRequest, NextResponse } from "next/server";
import {
  loadGenealogySlice,
  loadLiveSlice,
  loadMemorySlice,
} from "../../../../lib/power-brain/dataset";
import { liveResearch } from "../../../../lib/power-brain/live-research";

function pickGraph(scope: string | null) {
  if (scope === "memory") return loadMemorySlice();
  if (scope === "genealogy") return loadGenealogySlice();
  return loadLiveSlice();
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const scope = url.searchParams.get("scope");
  const extraQuery = url.searchParams.get("q");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const graph = pickGraph(scope);
  const node = graph.nodes.find((n) => n.id === id);
  if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });

  const queries = Array.from(
    new Set(
      [
        node.label,
        ...(extraQuery ? [extraQuery] : []),
        node.summary ? node.summary.split(/[.,]/)[0] : "",
      ].filter(Boolean)
    )
  );

  const results = await Promise.all(queries.map((q) => liveResearch(q)));
  const merged = results.flatMap((r) => r.hits);
  const dedupe = new Map<string, (typeof merged)[number]>();
  for (const h of merged) {
    const k = `${h.source}:${h.title.toLowerCase()}`;
    if (!dedupe.has(k)) dedupe.set(k, h);
  }
  const finalHits = Array.from(dedupe.values()).slice(0, 12);

  const summary = results[0]?.summary ?? "";

  return NextResponse.json({
    node: { id: node.id, label: node.label, group: node.group, type: node.type },
    queries,
    hits: finalHits,
    summary,
    bySource: {
      openalex: finalHits.filter((h) => h.source === "openalex").length,
      wikipedia: finalHits.filter((h) => h.source === "wikipedia").length,
      arxiv: finalHits.filter((h) => h.source === "arxiv").length,
    },
    errors: results.flatMap((r) => r.errors ?? []),
  });
}
