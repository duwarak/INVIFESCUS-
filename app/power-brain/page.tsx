"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BrainView } from "../../lib/power-brain/types";
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

export default function PowerBrainPage() {
  const [view, setView] = useState<BrainView>("live");
  const [showEdges, setShowEdges] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showSimilarity, setShowSimilarity] = useState(true);
  const [activeGroups, setActiveGroups] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
              Power Brain Simulator
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
              Polymath dataset · {memoryGraph.nodes.length} nodes
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
              {view === "memory" && (
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
          {view === "live" && (
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
          {view === "memory" && (
            <ForceCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              showLabels={showLabels}
              iterations={220}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id || null)}
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
