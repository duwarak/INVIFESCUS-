"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BrainNode, BrainEdge, BrainView } from "../../lib/power-brain/types";
import {
  loadAgents,
  loadGenealogySlice,
  loadLiveSlice,
  loadMemorySlice,
} from "../../lib/power-brain/dataset";
import { GROUP_COLORS, SURFACE } from "../../lib/power-brain/colors";

const RadialCanvas = dynamic(() => import("../../components/radial-canvas"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full text-sm"
      style={{ color: SURFACE.textMuted }}
    >
      Loading radial canvas…
    </div>
  ),
});
const GlowCanvas = dynamic(() => import("../../components/glow-canvas"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full text-sm"
      style={{ color: "#94a3b8" }}
    >
      Igniting glow cloud…
    </div>
  ),
});
const ForceGraph3DCanvas = dynamic(
  () => import("../../components/force-graph-3d"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: "#94a3b8" }}
      >
        Spinning up three.js scene…
      </div>
    ),
  }
);
const PolymathCanvas = dynamic(() => import("../../components/polymath-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-sm" style={{ color: "#5b6270" }}>
      Booting Omnilattice…
    </div>
  ),
});
const ForceCanvas = dynamic(() => import("../../components/force-canvas"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full text-sm"
      style={{ color: SURFACE.textMuted }}
    >
      Simulating force graph…
    </div>
  ),
});
const GenealogyCanvas = dynamic(
  () => import("../../components/genealogy-canvas"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: SURFACE.textMuted }}
      >
        Laying out genealogy…
      </div>
    ),
  }
);
const NodeDetailPanel = dynamic(
  () => import("../../components/node-detail-panel"),
  { ssr: false }
);

const TABS: { key: BrainView; label: string; sub: string }[] = [
  { key: "live", label: "Live Rings", sub: "Current topic mapping" },
  { key: "memory", label: "Memory Palace", sub: "Obsidian-style dense cloud" },
  { key: "genealogy", label: "Genealogy", sub: "Hierarchy + similarity" },
];

const AGENTS = loadAgents();

type LiveVisual = "rings" | "polymath" | "glow" | "force3d";
type MemoryVisual = "force" | "glow" | "force3d";

interface ExpansionNode {
  id: string;
  label: string;
  group: string;
  type: string;
  origin: "dataset" | "memory" | "openalex" | "wikipedia" | "arxiv" | "persona" | "crossdomain";
  url?: string;
  summary?: string;
  importance: number;
}
interface ExpansionEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
  origin: string;
}
interface AgentTrace {
  agent: string;
  action: string;
  produced: number;
}

interface LiveHit {
  id: string;
  label: string;
  source: "openalex" | "wikipedia" | "arxiv";
  url: string;
  parentId: string;
  ts: number;
}

export default function PowerBrainPage() {
  const [view, setView] = useState<BrainView>("live");
  const [liveVisual, setLiveVisual] = useState<LiveVisual>("polymath");
  const [memoryVisual, setMemoryVisual] = useState<MemoryVisual>("force3d");
  const [dim, setDim] = useState<"2d" | "3d">("3d");
  const [fgDim, setFgDim] = useState<"2d" | "3d">("3d");
  const [motion, setMotion] = useState(1);
  const [showEdges, setShowEdges] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showSimilarity, setShowSimilarity] = useState(true);
  const [activeGroups, setActiveGroups] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveHits, setLiveHits] = useState<LiveHit[]>([]);
  const [mounted, setMounted] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<ExpansionNode[]>([]);
  const [expandedEdges, setExpandedEdges] = useState<ExpansionEdge[]>([]);
  const [expanding, setExpanding] = useState(false);
  const [lastTrace, setLastTrace] = useState<AgentTrace[]>([]);

  useEffect(() => setMounted(true), []);

  const liveGraph = useMemo(() => loadLiveSlice(), []);
  const memoryGraph = useMemo(() => loadMemorySlice(), []);
  const genealogyGraph = useMemo(() => loadGenealogySlice(), []);
  const graph =
    view === "live"
      ? liveGraph
      : view === "memory"
        ? memoryGraph
        : genealogyGraph;

  const filteredNodes = useMemo(() => {
    if (!activeGroups.size) return graph.nodes;
    return graph.nodes.filter((n) => activeGroups.has(n.group));
  }, [graph.nodes, activeGroups]);

  const filteredEdges = useMemo(() => {
    if (!activeGroups.size) return graph.edges;
    const ids = new Set(filteredNodes.map((n) => n.id));
    return graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }, [graph.edges, activeGroups, filteredNodes]);

  const presentGroups = useMemo(() => {
    const set = new Set<string>();
    graph.nodes.forEach((n) => set.add(n.group));
    return Array.from(set);
  }, [graph.nodes]);

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedId) ?? null,
    [graph.nodes, selectedId]
  );

  const toggleGroup = (g: string) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  useEffect(() => {
    if (!selectedId || liveVisual !== "glow") return;
    let aborted = false;
    fetch(`/api/power-brain/research?id=${encodeURIComponent(selectedId)}&scope=${view}`)
      .then((r) => r.json())
      .then((j: { hits: { source: "openalex" | "wikipedia" | "arxiv"; title: string; url: string }[] }) => {
        if (aborted || !j.hits) return;
        const ts = Date.now();
        const fresh: LiveHit[] = j.hits.slice(0, 8).map((h, i) => ({
          id: `hit-${selectedId}-${h.source}-${i}-${ts}`,
          label: h.title.slice(0, 64),
          source: h.source,
          url: h.url,
          parentId: selectedId,
          ts,
        }));
        setLiveHits((prev) => {
          const keep = prev.filter((p) => p.parentId !== selectedId);
          return [...keep.slice(-20), ...fresh];
        });
      })
      .catch(() => undefined);
    return () => {
      aborted = true;
    };
  }, [selectedId, liveVisual, view]);

  useEffect(() => {
    if (!selectedId || (liveVisual !== "polymath" && view !== "live")) return;
    if (liveVisual !== "polymath") return;
    if (selectedId.startsWith("web-") || selectedId.startsWith("persona-")) return;
    let aborted = false;
    setExpanding(true);
    fetch(`/api/power-brain/expand?id=${encodeURIComponent(selectedId)}&scope=${view}`)
      .then((r) => r.json())
      .then((j: { newNodes: ExpansionNode[]; newEdges: ExpansionEdge[]; trace: AgentTrace[] }) => {
        if (aborted) return;
        setExpandedNodes((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const additions = (j.newNodes ?? []).filter((n) => !ids.has(n.id));
          return [...prev, ...additions].slice(-400);
        });
        setExpandedEdges((prev) => {
          const key = (e: ExpansionEdge) => `${e.source}->${e.target}:${e.type}`;
          const seen = new Set(prev.map(key));
          const additions = (j.newEdges ?? []).filter((e) => !seen.has(key(e)));
          return [...prev, ...additions].slice(-800);
        });
        setLastTrace(j.trace ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!aborted) setExpanding(false);
      });
    return () => {
      aborted = true;
    };
  }, [selectedId, liveVisual, view]);

  const resetExpansion = () => {
    setExpandedNodes([]);
    setExpandedEdges([]);
    setLastTrace([]);
    setSelectedId(null);
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-3rem)] gap-4 p-2 -m-6 px-6 pt-6 pb-6"
      style={{ background: SURFACE.bg }}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2
              className="text-2xl font-semibold"
              style={{ color: SURFACE.text }}
            >
              Omnilattice Simulator
            </h2>
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: SURFACE.accentSoft, color: SURFACE.accent }}
            >
              {AGENTS.length} agents · live
            </span>
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "#e0f3ff", color: "#0369a1" }}
            >
              Invifescus dataset · {mounted ? memoryGraph.nodes.length : "…"} nodes
            </span>
          </div>
          <p
            className="text-sm mt-1"
            style={{ color: SURFACE.textMuted }}
          >
            MemPalace stores · MiroFish answers · infographic-generator renders ·
            6-agent MACS pipeline. Click any node to inspect.
          </p>
        </div>

        <div
          className="flex items-center gap-1 rounded-xl p-1 border"
          style={{ background: SURFACE.panel, borderColor: SURFACE.border }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setView(t.key);
                setSelectedId(null);
              }}
              className="px-4 py-2 text-sm rounded-lg transition-colors text-left"
              style={
                view === t.key
                  ? { background: SURFACE.text, color: "#ffffff" }
                  : { color: SURFACE.textMuted, background: "transparent" }
              }
            >
              <div className="font-semibold leading-tight">{t.label}</div>
              <div
                className="text-[10px] mt-0.5"
                style={{ color: view === t.key ? "#cbd5e1" : SURFACE.textMuted }}
              >
                {t.sub}
              </div>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 flex gap-4 min-h-0">
        <aside
          className="w-56 shrink-0 rounded-xl border p-4 flex flex-col gap-5 overflow-auto"
          style={{ background: SURFACE.panel, borderColor: SURFACE.border }}
        >
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: SURFACE.textMuted }}
            >
              Stats
            </div>
            <div
              className="text-lg font-semibold"
              style={{ color: SURFACE.text }}
            >
              {filteredNodes.length}
              <span
                className="text-xs ml-1 font-normal"
                style={{ color: SURFACE.textMuted }}
              >
                nodes
              </span>
            </div>
            <div
              className="text-lg font-semibold"
              style={{ color: SURFACE.text }}
            >
              {filteredEdges.length}
              <span
                className="text-xs ml-1 font-normal"
                style={{ color: SURFACE.textMuted }}
              >
                edges
              </span>
            </div>
          </div>

          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: SURFACE.textMuted }}
            >
              6 Agent rings
            </div>
            <div className="flex flex-col gap-2">
              {AGENTS.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: SURFACE.text }}
                  title={a.description}
                >
                  <span
                    className="w-6 h-6 rounded-full grid place-items-center text-[11px]"
                    style={{ background: `${a.color}22`, color: a.color }}
                  >
                    {a.icon}
                  </span>
                  <span className="flex-1 truncate text-[11px]">
                    {a.name.replace(" Agent", "")}
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: a.color }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: SURFACE.textMuted }}
            >
              Domains
            </div>
            <div className="flex flex-col gap-1.5">
              {presentGroups.map((g) => {
                const active = !activeGroups.size || activeGroups.has(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGroup(g)}
                    className="flex items-center gap-2 text-xs rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-50"
                    style={{ color: active ? SURFACE.text : SURFACE.textMuted }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background: GROUP_COLORS[g] ?? GROUP_COLORS.unknown,
                        opacity: active ? 1 : 0.3,
                      }}
                    />
                    <span className="truncate">{g}</span>
                  </button>
                );
              })}
            </div>
            {activeGroups.size > 0 && (
              <button
                onClick={() => setActiveGroups(new Set())}
                className="mt-2 text-xs underline"
                style={{ color: SURFACE.accent }}
              >
                Clear filter
              </button>
            )}
          </div>

          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: SURFACE.textMuted }}
            >
              Display
            </div>
            <div className="flex flex-col gap-2">
              {view === "live" && (
                <>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: SURFACE.textMuted }}
                  >
                    Visual mode
                  </div>
                  <div
                    className="flex flex-col gap-0.5 rounded-md p-0.5 border"
                    style={{ borderColor: SURFACE.border }}
                  >
                    {([
                      { k: "polymath", label: "Omnilattice Brain" },
                      { k: "rings", label: "Rings" },
                      { k: "glow", label: "Glow Cloud" },
                      { k: "force3d", label: "Force-Graph 3D" },
                    ] as { k: LiveVisual; label: string }[]).map((m) => (
                      <button
                        key={m.k}
                        onClick={() => setLiveVisual(m.k)}
                        className="flex-1 text-[11px] py-1 rounded-md transition-colors"
                        style={
                          liveVisual === m.k
                            ? { background: SURFACE.text, color: "#ffffff", fontWeight: 600 }
                            : { color: SURFACE.textMuted }
                        }
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {liveVisual === "rings" && (
                    <label
                      className="flex items-center gap-2 text-xs cursor-pointer"
                      style={{ color: SURFACE.text }}
                    >
                      <input
                        type="checkbox"
                        checked={showEdges}
                        onChange={(e) => setShowEdges(e.target.checked)}
                      />
                      Show ring edges
                    </label>
                  )}
                  {liveVisual === "glow" && (
                    <>
                      <div
                        className="flex items-center gap-0.5 rounded-md p-0.5 border"
                        style={{ borderColor: SURFACE.border }}
                      >
                        {(["2d", "3d"] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => setDim(d)}
                            className="flex-1 text-[11px] py-1 rounded-md transition-colors uppercase"
                            style={
                              dim === d
                                ? { background: SURFACE.text, color: "#ffffff", fontWeight: 600 }
                                : { color: SURFACE.textMuted }
                            }
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <label
                        className="flex flex-col gap-1 text-[11px]"
                        style={{ color: SURFACE.textMuted }}
                      >
                        Motion intensity
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.05}
                          value={motion}
                          onChange={(e) => setMotion(Number(e.target.value))}
                        />
                      </label>
                    </>
                  )}
                  {liveVisual === "force3d" && (
                    <div
                      className="flex items-center gap-0.5 rounded-md p-0.5 border"
                      style={{ borderColor: SURFACE.border }}
                    >
                      {(["2d", "3d"] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setFgDim(d)}
                          className="flex-1 text-[11px] py-1 rounded-md transition-colors uppercase"
                          style={
                            fgDim === d
                              ? { background: SURFACE.text, color: "#ffffff", fontWeight: 600 }
                              : { color: SURFACE.textMuted }
                          }
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                  {liveVisual === "polymath" && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={resetExpansion}
                        className="text-[11px] font-semibold rounded-md py-1.5 border transition-colors"
                        style={{
                          borderColor: SURFACE.border,
                          color: SURFACE.text,
                          background: "#ffffff",
                        }}
                      >
                        Reset growth ({expandedNodes.length})
                      </button>
                      {lastTrace.length > 0 && (
                        <div className="flex flex-col gap-1 text-[10px]">
                          {lastTrace.map((t, i) => (
                            <div key={i} className="flex justify-between" style={{ color: SURFACE.textMuted }}>
                              <span className="truncate">{t.agent.replace(" Agent", "")}</span>
                              <span style={{ color: SURFACE.accent }}>+{t.produced}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {view === "memory" && (
                <>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: SURFACE.textMuted }}
                  >
                    Visual mode
                  </div>
                  <div
                    className="flex flex-col gap-0.5 rounded-md p-0.5 border"
                    style={{ borderColor: SURFACE.border }}
                  >
                    {([
                      { k: "force3d", label: "Force-Graph 3D" },
                      { k: "glow", label: "Glow Cloud" },
                      { k: "force", label: "Compact Force" },
                    ] as { k: MemoryVisual; label: string }[]).map((m) => (
                      <button
                        key={m.k}
                        onClick={() => setMemoryVisual(m.k)}
                        className="flex-1 text-[11px] py-1 rounded-md transition-colors text-left px-2"
                        style={
                          memoryVisual === m.k
                            ? { background: SURFACE.text, color: "#ffffff", fontWeight: 600 }
                            : { color: SURFACE.textMuted }
                        }
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {memoryVisual === "glow" && (
                    <>
                      <div
                        className="flex items-center gap-0.5 rounded-md p-0.5 border"
                        style={{ borderColor: SURFACE.border }}
                      >
                        {(["2d", "3d"] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => setDim(d)}
                            className="flex-1 text-[11px] py-1 rounded-md transition-colors uppercase"
                            style={
                              dim === d
                                ? { background: SURFACE.text, color: "#ffffff", fontWeight: 600 }
                                : { color: SURFACE.textMuted }
                            }
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <label
                        className="flex flex-col gap-1 text-[11px]"
                        style={{ color: SURFACE.textMuted }}
                      >
                        Motion intensity
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.05}
                          value={motion}
                          onChange={(e) => setMotion(Number(e.target.value))}
                        />
                      </label>
                    </>
                  )}
                  {memoryVisual === "force3d" && (
                    <div
                      className="flex items-center gap-0.5 rounded-md p-0.5 border"
                      style={{ borderColor: SURFACE.border }}
                    >
                      {(["2d", "3d"] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setFgDim(d)}
                          className="flex-1 text-[11px] py-1 rounded-md transition-colors uppercase"
                          style={
                            fgDim === d
                              ? { background: SURFACE.text, color: "#ffffff", fontWeight: 600 }
                              : { color: SURFACE.textMuted }
                          }
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                  {memoryVisual === "force" && (
                    <label
                      className="flex items-center gap-2 text-xs cursor-pointer"
                      style={{ color: SURFACE.text }}
                    >
                      <input
                        type="checkbox"
                        checked={showLabels}
                        onChange={(e) => setShowLabels(e.target.checked)}
                      />
                      Show labels
                    </label>
                  )}
                </>
              )}
              {view === "genealogy" && (
                <label
                  className="flex items-center gap-2 text-xs cursor-pointer"
                  style={{ color: SURFACE.text }}
                >
                  <input
                    type="checkbox"
                    checked={showSimilarity}
                    onChange={(e) => setShowSimilarity(e.target.checked)}
                  />
                  Show similarity edges
                </label>
              )}
            </div>
          </div>
        </aside>

        <div
          className="flex-1 rounded-xl border overflow-hidden"
          style={{ background: SURFACE.panel, borderColor: SURFACE.border }}
        >
          {view === "live" && liveVisual === "polymath" && (
            <PolymathCanvas
              baseNodes={filteredNodes}
              baseEdges={filteredEdges}
              expandedNodes={expandedNodes}
              expandedEdges={expandedEdges}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
              onOpenUrl={(url) => {
                if (typeof window !== "undefined") window.open(url, "_blank");
              }}
              expanding={expanding}
            />
          )}
          {view === "live" && liveVisual === "rings" && (
            <RadialCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              showEdges={showEdges}
              centerCount={6}
              maxRing={3}
              baseR={170}
              ringGap={150}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
            />
          )}
          {view === "live" && liveVisual === "glow" && (
            <GlowCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              liveHits={liveHits}
              dim={dim}
              motion={motion}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
              onHitOpen={(hit) => {
                if (typeof window !== "undefined") window.open(hit.url, "_blank");
              }}
            />
          )}
          {view === "live" && liveVisual === "force3d" && (
            <ForceGraph3DCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              liveHits={liveHits}
              dim={fgDim}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
              onHitOpen={(hit) => {
                if (typeof window !== "undefined") window.open(hit.url, "_blank");
              }}
            />
          )}
          {view === "memory" && memoryVisual === "force" && (
            <ForceCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              showLabels={showLabels}
              iterations={220}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
            />
          )}
          {view === "memory" && memoryVisual === "glow" && (
            <GlowCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              liveHits={liveHits}
              dim={dim}
              motion={motion}
              spread={2.2}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
              onHitOpen={(hit) => {
                if (typeof window !== "undefined") window.open(hit.url, "_blank");
              }}
            />
          )}
          {view === "memory" && memoryVisual === "force3d" && (
            <ForceGraph3DCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              liveHits={liveHits}
              dim={fgDim}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
              onHitOpen={(hit) => {
                if (typeof window !== "undefined") window.open(hit.url, "_blank");
              }}
            />
          )}
          {view === "genealogy" && (
            <GenealogyCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              showSimilarity={showSimilarity}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
            />
          )}
        </div>

        <NodeDetailPanel
          node={selectedNode}
          graphScope={view}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
