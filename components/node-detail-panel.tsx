"use client";

import { useEffect, useState } from "react";
import { BrainNode } from "../lib/power-brain/types";
import { colorFor, SURFACE, TYPE_GLYPH } from "../lib/power-brain/colors";
import type { InsightLevels, InsightNeighbor } from "../lib/power-brain/insights";
import type { Persona, DebateTurn } from "../lib/power-brain/persona";
import type { ResearchHit } from "../lib/power-brain/live-research";

interface Props {
  node: BrainNode | null;
  graphScope: "live" | "memory" | "genealogy";
  onClose: () => void;
}

type TabKey = "insights" | "persona" | "debate" | "qa" | "science";

interface QAResponse {
  mode: string;
  speaker?: string;
  faction?: string;
  answer: string;
  provenance?: { kind: string; ref: string }[];
  hits?: ResearchHit[];
}

interface ResearchResp {
  hits: ResearchHit[];
  summary: string;
  bySource: { openalex: number; wikipedia: number; arxiv: number };
  errors?: { source: string; message: string }[];
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "insights", label: "Insights" },
  { key: "science", label: "Science" },
  { key: "persona", label: "Persona" },
  { key: "debate", label: "Debate" },
  { key: "qa", label: "Q&A" },
];

const SOURCE_COLORS: Record<ResearchHit["source"], string> = {
  openalex: "#0ea5e9",
  wikipedia: "#5b6cff",
  arxiv: "#ef476f",
};

export default function NodeDetailPanel({ node, graphScope, onClose }: Props) {
  const [tab, setTab] = useState<TabKey>("insights");
  const [insights, setInsights] = useState<InsightLevels | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [debate, setDebate] = useState<DebateTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ levels: number; createdEdges: number } | null>(null);
  const [qa, setQa] = useState<QAResponse | null>(null);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState<string | null>(null);
  const [research, setResearch] = useState<ResearchResp | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);

  useEffect(() => {
    setInsights(null);
    setPersona(null);
    setDebate([]);
    setPushResult(null);
    setQa(null);
    setResearch(null);
    setTab("insights");
    if (!node) return;

    setLoading(true);
    Promise.all([
      fetch(`/api/power-brain/insights?id=${encodeURIComponent(node.id)}&scope=${graphScope}`).then((r) => r.json()),
      fetch(`/api/power-brain/persona?id=${encodeURIComponent(node.id)}&scope=${graphScope}`).then((r) => r.json()),
    ])
      .then(([ins, pp]) => {
        setInsights(ins as InsightLevels);
        setPersona(pp.persona as Persona);
        setDebate(pp.debate as DebateTurn[]);
      })
      .finally(() => setLoading(false));
  }, [node, graphScope]);

  useEffect(() => {
    if (!node || tab !== "science" || research || researchLoading) return;
    setResearchLoading(true);
    fetch(`/api/power-brain/research?id=${encodeURIComponent(node.id)}&scope=${graphScope}`)
      .then((r) => r.json())
      .then((j) => setResearch(j as ResearchResp))
      .finally(() => setResearchLoading(false));
  }, [tab, node, graphScope, research, researchLoading]);

  if (!node) {
    return (
      <aside
        className="w-[26rem] shrink-0 rounded-xl border p-5 flex flex-col gap-2"
        style={{ background: SURFACE.panel, borderColor: SURFACE.border, color: SURFACE.textMuted }}
      >
        <div className="text-xs uppercase tracking-wider font-semibold">Inspector</div>
        <p className="text-sm leading-relaxed">
          Click any node to see L1–L4 insights, live scientific sources (OpenAlex + Wikipedia + arXiv),
          its speaking persona, a live debate snapshot, and four-mode Q&A
          (graph / scenario / agent / web).
        </p>
      </aside>
    );
  }

  const color = colorFor(node.group);

  const pushToMemory = async () => {
    setPushing(true);
    try {
      const r = await fetch("/api/power-brain/push-to-memory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nodeId: node.id }),
      });
      const j = await r.json();
      setPushResult({ levels: j.levels ?? 0, createdEdges: j.createdEdges ?? 0 });
    } finally {
      setPushing(false);
    }
  };

  const askQa = async (mode: "graph" | "scenario" | "agent" | "web") => {
    setQaLoading(mode);
    setQa(null);
    try {
      const r = await fetch("/api/power-brain/qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, scope: graphScope, mode, question: qaQuestion }),
      });
      const j = (await r.json()) as QAResponse;
      setQa(j);
    } finally {
      setQaLoading(null);
    }
  };

  return (
    <aside
      className="w-[26rem] shrink-0 rounded-xl border flex flex-col overflow-hidden"
      style={{ background: SURFACE.panel, borderColor: SURFACE.border }}
    >
      <header className="px-5 py-4 border-b" style={{ borderColor: SURFACE.border }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full grid place-items-center text-base font-bold"
              style={{ background: `${color}22`, color }}
            >
              {TYPE_GLYPH[node.type] ?? "◆"}
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight" style={{ color: SURFACE.text }}>
                {node.label}
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color }}>
                {node.group} · {node.type}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-xs" style={{ color: SURFACE.textMuted }}>
            ✕
          </button>
        </div>

        {insights && (
          <div className="flex gap-1.5 mt-3 text-[10px] flex-wrap">
            <Pill color={SURFACE.accent} bg={SURFACE.accentSoft}>
              centrality {(insights.signals.centrality * 100).toFixed(0)}%
            </Pill>
            <Pill color="#0369a1" bg="#e0f3ff">
              bridges {(insights.signals.bridgeRatio * 100).toFixed(0)}%
            </Pill>
            <Pill color="#9b6dff" bg="#f1eaff">
              depth {insights.signals.depth}-hop
            </Pill>
            <Pill color="#06b6a8" bg="#defaf6">
              novelty {(insights.signals.novelty * 100).toFixed(0)}%
            </Pill>
          </div>
        )}

        <div
          className="mt-3 flex items-center gap-0.5 rounded-lg p-0.5 border overflow-x-auto"
          style={{ borderColor: SURFACE.border }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 text-[11px] py-1.5 px-1 rounded-md transition-colors whitespace-nowrap"
              style={
                tab === t.key
                  ? { background: SURFACE.text, color: "#ffffff", fontWeight: 600 }
                  : { color: SURFACE.textMuted }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-5">
        {loading && tab !== "science" && (
          <div className="text-xs" style={{ color: SURFACE.textMuted }}>
            MiroFish reading MemPalace, building persona…
          </div>
        )}

        {!loading && tab === "insights" && insights && (
          <>
            <InsightSection title="L1 · Direct ties" items={insights.L1_direct} />
            <InsightSection title="L2 · Two-hop reach" items={insights.L2_twoHop} />
            <InsightSection title="L3 · Cluster peers (same domain)" items={insights.L3_cluster} />
            <InsightSection title="L4 · Cross-domain bridges" items={insights.L4_crossDomain} />

            <section className="rounded-lg border p-3" style={{ borderColor: SURFACE.border }}>
              <div
                className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
                style={{ color: SURFACE.textMuted }}
              >
                Push insights → Memory Palace
              </div>
              <p className="text-xs leading-relaxed" style={{ color: SURFACE.text }}>
                Persists L1–L4 as four synthesis nodes wired back into the graph. Memory Palace
                view will surface them as multi-level architecture.
              </p>
              <button
                onClick={pushToMemory}
                disabled={pushing}
                className="mt-2 w-full text-xs font-semibold rounded-md py-2 transition-colors"
                style={{ background: SURFACE.accent, color: "#ffffff", opacity: pushing ? 0.6 : 1 }}
              >
                {pushing ? "Pushing…" : pushResult ? "Push again" : "Push to second brain"}
              </button>
              {pushResult && (
                <div className="text-[11px] mt-2" style={{ color: SURFACE.textMuted }}>
                  Stored {pushResult.levels} synthesis levels · {pushResult.createdEdges} new edges.
                </div>
              )}
            </section>
          </>
        )}

        {tab === "science" && (
          <section className="flex flex-col gap-4">
            {researchLoading && (
              <div className="text-xs" style={{ color: SURFACE.textMuted }}>
                Querying OpenAlex, Wikipedia, arXiv in parallel…
              </div>
            )}
            {research && (
              <>
                <div className="rounded-lg border p-3" style={{ borderColor: SURFACE.border }}>
                  <div
                    className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
                    style={{ color: SURFACE.textMuted }}
                  >
                    Live scientific synthesis
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: SURFACE.text }}>
                    {research.summary || "No synthesis available."}
                  </p>
                  <div className="flex gap-1.5 mt-2 text-[10px]">
                    <Pill color={SOURCE_COLORS.openalex} bg="#e0f3ff">
                      OpenAlex {research.bySource.openalex}
                    </Pill>
                    <Pill color={SOURCE_COLORS.wikipedia} bg="#eef0ff">
                      Wikipedia {research.bySource.wikipedia}
                    </Pill>
                    <Pill color={SOURCE_COLORS.arxiv} bg="#ffeaf0">
                      arXiv {research.bySource.arxiv}
                    </Pill>
                  </div>
                </div>

                {research.hits.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {research.hits.map((h, i) => (
                      <a
                        key={i}
                        href={h.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: SURFACE.border }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-semibold"
                            style={{
                              background: `${SOURCE_COLORS[h.source]}1a`,
                              color: SOURCE_COLORS[h.source],
                            }}
                          >
                            {h.source}
                          </span>
                          {h.year && (
                            <span className="text-[10px]" style={{ color: SURFACE.textMuted }}>
                              {h.year}
                            </span>
                          )}
                          {h.citationCount != null && (
                            <span className="text-[10px]" style={{ color: SURFACE.textMuted }}>
                              · {h.citationCount.toLocaleString()} citations
                            </span>
                          )}
                        </div>
                        <div
                          className="text-xs font-semibold leading-tight"
                          style={{ color: SURFACE.text }}
                        >
                          {h.title}
                        </div>
                        {h.authors && h.authors.length > 0 && (
                          <div className="text-[10px] mt-1" style={{ color: SURFACE.textMuted }}>
                            {h.authors.slice(0, 3).join(", ")}
                            {h.authors.length > 3 ? " et al." : ""}
                          </div>
                        )}
                        {h.snippet && (
                          <p
                            className="text-[11px] mt-1.5 leading-relaxed"
                            style={{ color: SURFACE.text }}
                          >
                            {h.snippet.slice(0, 220)}
                            {h.snippet.length > 220 ? "…" : ""}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                )}

                {research.errors && research.errors.length > 0 && (
                  <div className="text-[10px]" style={{ color: SURFACE.textMuted }}>
                    Partial: {research.errors.map((e) => e.source).join(", ")} unavailable
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {!loading && tab === "persona" && persona && (
          <section>
            <div
              className="text-[10px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: SURFACE.textMuted }}
            >
              Speaking persona
            </div>
            <div
              className="rounded-lg border p-3 flex flex-col gap-2"
              style={{ borderColor: SURFACE.border }}
            >
              <KV k="Speaking as" v={persona.speakingAs} />
              <KV k="Faction" v={persona.faction} />
              <KV k="Stance" v={persona.stance} />
              <KV k="Bias" v={persona.bias} />
              <KV k="Style" v={persona.speakingStyle} />
              <KV k="Memory window" v={persona.memoryWindow} />
              <KV k="Confidence" v={`${(persona.confidence * 100).toFixed(0)}%`} />
            </div>
            {persona.knowledgeScope.length > 0 && (
              <div className="mt-3">
                <div
                  className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
                  style={{ color: SURFACE.textMuted }}
                >
                  Knowledge scope
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {persona.knowledgeScope.map((k) => (
                    <span
                      key={k}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: SURFACE.accentSoft, color: SURFACE.accent }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {!loading && tab === "debate" && (
          <section className="flex flex-col gap-3">
            <div
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: SURFACE.textMuted }}
            >
              Live debate — moderator · proponent · critic · synthesizer
            </div>
            {debate.map((turn, i) => (
              <div
                key={i}
                className="rounded-lg border p-3"
                style={{
                  borderColor: SURFACE.border,
                  background:
                    turn.role === "moderator"
                      ? "#fff7ed"
                      : turn.role === "proponent"
                        ? "#eef0ff"
                        : turn.role === "critic"
                          ? "#ffeaf0"
                          : "#defaf6",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-wider font-semibold mb-1"
                  style={{ color: SURFACE.textMuted }}
                >
                  {turn.role} · {turn.speaker}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: SURFACE.text }}>
                  {turn.text}
                </div>
              </div>
            ))}
          </section>
        )}

        {!loading && tab === "qa" && (
          <section className="flex flex-col gap-3">
            <div
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: SURFACE.textMuted }}
            >
              Four answer modes
            </div>
            <input
              value={qaQuestion}
              onChange={(e) => setQaQuestion(e.target.value)}
              placeholder="Optional question…"
              className="text-xs px-3 py-2 rounded-md border outline-none"
              style={{ borderColor: SURFACE.border, color: SURFACE.text }}
            />
            <div className="grid grid-cols-4 gap-1.5">
              {(["graph", "scenario", "agent", "web"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => askQa(m)}
                  disabled={qaLoading !== null}
                  className="text-[10px] font-semibold py-2 rounded-md border transition-colors"
                  style={{
                    borderColor:
                      m === "graph"
                        ? "#5b6cff"
                        : m === "scenario"
                          ? "#9b6dff"
                          : m === "agent"
                            ? "#06b6a8"
                            : "#f4a02e",
                    color: SURFACE.text,
                    background:
                      qaLoading === m
                        ? "#f4f4f6"
                        : m === "graph"
                          ? "#eef0ff"
                          : m === "scenario"
                            ? "#f1eaff"
                            : m === "agent"
                              ? "#defaf6"
                              : "#fff4e0",
                  }}
                >
                  {qaLoading === m
                    ? "…"
                    : m === "graph"
                      ? "Graph"
                      : m === "scenario"
                        ? "Scenario"
                        : m === "agent"
                          ? "Agent"
                          : "Web"}
                </button>
              ))}
            </div>
            {qa && (
              <div
                className="rounded-lg border p-3"
                style={{ borderColor: SURFACE.border }}
              >
                <div
                  className="text-[10px] uppercase tracking-wider font-semibold mb-1"
                  style={{ color: SURFACE.accent }}
                >
                  {qa.mode}
                  {qa.speaker ? ` · ${qa.speaker}` : ""}
                  {qa.faction ? ` · ${qa.faction}` : ""}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: SURFACE.text }}>
                  {qa.answer}
                </p>
                {qa.provenance && qa.provenance.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {qa.provenance.slice(0, 6).map((p, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full border"
                        style={{
                          borderColor: SURFACE.border,
                          color: SURFACE.textMuted,
                        }}
                      >
                        {p.kind}:{p.ref.slice(0, 36)}
                      </span>
                    ))}
                  </div>
                )}
                {qa.hits && qa.hits.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {qa.hits.slice(0, 4).map((h, i) => (
                      <a
                        key={i}
                        href={h.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] underline"
                        style={{ color: SOURCE_COLORS[h.source] }}
                      >
                        [{h.source}] {h.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}

function Pill({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-xs flex gap-2">
      <span className="w-28 shrink-0" style={{ color: SURFACE.textMuted }}>
        {k}
      </span>
      <span className="flex-1" style={{ color: SURFACE.text }}>
        {v}
      </span>
    </div>
  );
}

function InsightSection({ title, items }: { title: string; items: InsightNeighbor[] }) {
  if (!items.length) return null;
  return (
    <section>
      <div
        className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
        style={{ color: SURFACE.textMuted }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((n) => (
          <div key={n.node.id} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: colorFor(n.node.group) }}
            />
            <span className="flex-1 truncate" style={{ color: SURFACE.text }}>
              {n.node.label}
            </span>
            <span
              className="text-[10px] whitespace-nowrap"
              style={{ color: SURFACE.textMuted }}
            >
              {n.relation} · {(n.weight * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
