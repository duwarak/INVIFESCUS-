"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { BrainEdge, BrainNode } from "../lib/power-brain/types";
import { colorFor, vibrantFor } from "../lib/power-brain/colors";
import { computeCentrality, neighborsByPriority } from "../lib/power-brain/centrality";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export interface ExpansionNode {
  id: string;
  label: string;
  group: string;
  type: string;
  origin: "dataset" | "memory" | "openalex" | "wikipedia" | "arxiv" | "persona" | "crossdomain";
  url?: string;
  summary?: string;
  importance: number;
}

export interface ExpansionEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
  origin: string;
}

export interface AgentTrace {
  agent: string;
  action: string;
  produced: number;
}

interface Props {
  baseNodes: BrainNode[];
  baseEdges: BrainEdge[];
  expandedNodes: ExpansionNode[];
  expandedEdges: ExpansionEdge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenUrl?: (url: string) => void;
  expanding: boolean;
}

const ORIGIN_COLORS: Record<ExpansionNode["origin"], string> = {
  dataset: "#94a3b8",
  memory: "#5b6cff",
  openalex: "#0ea5e9",
  wikipedia: "#9b6dff",
  arxiv: "#ef476f",
  persona: "#f4a02e",
  crossdomain: "#22c55e",
};

interface GN {
  id: string;
  label: string;
  group: string;
  color: string;
  val: number;
  origin: ExpansionNode["origin"];
  url?: string;
  importance: number;
  isHub?: boolean;
  centrality?: number;
}

interface GL {
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
  origin?: string;
  rank?: number;
  isFocus?: boolean;
}

function priorityColor(rank: number): string {
  if (rank === 0) return "#1c1f26";
  if (rank === 1) return "#ef476f";
  if (rank === 2) return "#f4a02e";
  if (rank <= 4) return "#9b6dff";
  if (rank <= 7) return "#0ea5e9";
  return "#94a3b8";
}

export default function PolymathCanvas({
  baseNodes,
  baseEdges,
  expandedNodes,
  expandedEdges,
  selectedId,
  onSelect,
  onOpenUrl,
  expanding,
}: Props) {
  const ref = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const resize = () => setSize({ w: wrap.clientWidth, h: wrap.clientHeight });
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const expByOrigin = useMemo(() => {
    const o: Record<string, number> = {};
    for (const e of expandedNodes) o[e.origin] = (o[e.origin] ?? 0) + 1;
    return o;
  }, [expandedNodes]);

  const combined = useMemo(() => {
    const expIds = new Set(expandedNodes.map((n) => n.id));
    const dsExpansion: ExpansionNode[] = baseNodes.map((n) => ({
      id: n.id,
      label: n.label,
      group: n.group,
      type: n.type,
      origin: "dataset",
      summary: n.summary,
      importance: n.importance,
    }));
    const nodes = [...dsExpansion, ...expandedNodes.filter((n) => !baseNodes.some((b) => b.id === n.id))];
    const edges: ExpansionEdge[] = [
      ...baseEdges.map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight,
        origin: "dataset",
      })),
      ...expandedEdges,
    ];
    return { nodes, edges, expIds };
  }, [baseNodes, baseEdges, expandedNodes, expandedEdges]);

  const centrality = useMemo(() => {
    return computeCentrality({
      nodes: combined.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        group: n.group,
        type: n.type as any,
        score: 0.5,
        importance: n.importance,
        ts: Date.now(),
      })),
      edges: combined.edges.map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type as any,
        weight: e.weight,
      })),
    });
  }, [combined]);

  const priorityRanks = useMemo(() => {
    if (!selectedId) return new Map<string, number>();
    const ordered = neighborsByPriority(
      {
        nodes: combined.nodes.map((n) => ({
          id: n.id,
          label: n.label,
          group: n.group,
          type: n.type as any,
          score: 0.5,
          importance: n.importance,
          ts: Date.now(),
        })),
        edges: combined.edges.map((e) => ({
          source: e.source,
          target: e.target,
          type: e.type as any,
          weight: e.weight,
        })),
      },
      centrality,
      selectedId
    );
    return new Map(ordered.map((n) => [n.id, n.rank]));
  }, [selectedId, combined, centrality]);

  const graphData = useMemo(() => {
    const gNodes: GN[] = combined.nodes.map((n) => {
      const c = centrality.map.get(n.id);
      const base = n.origin === "dataset" ? vibrantFor(n.group, n.id) : ORIGIN_COLORS[n.origin];
      return {
        id: n.id,
        label: n.label,
        group: n.group,
        color: base,
        val: 4 + n.importance * 5 + (c?.norm ?? 0) * 4,
        origin: n.origin,
        url: n.url,
        importance: n.importance,
        isHub: c?.isHub ?? false,
        centrality: c?.norm ?? 0,
      };
    });
    const gLinks: GL[] = combined.edges.map((e) => {
      const rank = priorityRanks.get(
        e.source === selectedId ? e.target : e.target === selectedId ? e.source : ""
      );
      const isFocus = selectedId === e.source || selectedId === e.target;
      return {
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight,
        label: e.label,
        origin: e.origin,
        rank,
        isFocus,
      };
    });
    return { nodes: gNodes, links: gLinks };
  }, [combined, centrality, priorityRanks, selectedId]);

  const neighborSet = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>([selectedId]);
    for (const l of graphData.links) {
      const a = (l.source as any).id ?? l.source;
      const b = (l.target as any).id ?? l.target;
      if (a === selectedId) s.add(b);
      if (b === selectedId) s.add(a);
    }
    return s;
  }, [graphData.links, selectedId]);

  useEffect(() => {
    if (!selectedId || !ref.current) return;
    const n: any = graphData.nodes.find((x) => x.id === selectedId);
    if (!n || n.x == null) return;
    ref.current.centerAt(n.x, n.y, 1000);
    ref.current.zoom(2.2, 1000);
  }, [selectedId, graphData.nodes, expandedNodes.length]);

  return (
    <div
      ref={wrapRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: "#fafafa" }}
    >
      <ForceGraph2D
        ref={ref}
        graphData={graphData}
        width={size.w}
        height={size.h}
        backgroundColor="#fafafa"
        cooldownTicks={Infinity as any}
        warmupTicks={80}
        d3AlphaDecay={0.014}
        d3VelocityDecay={0.34}
        linkColor={(l: any) => {
          if (l.isFocus && l.rank != null) return priorityColor(l.rank);
          if (l.origin && l.origin !== "dataset") return ORIGIN_COLORS[l.origin as ExpansionNode["origin"]] ?? "#cbd5e1";
          return "#cbd5e1";
        }}
        linkWidth={(l: any) => {
          if (l.isFocus && l.rank != null) return Math.max(0.8, 4.5 - l.rank * 0.45);
          return l.origin && l.origin !== "dataset" ? 1.1 : 0.5;
        }}
        linkDirectionalParticles={(l: any) =>
          l.isFocus && (l.rank ?? 99) < 3 ? 2 : l.origin === "openalex" ? 1 : 0
        }
        linkDirectionalParticleSpeed={0.012}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={(l: any) =>
          l.isFocus && l.rank != null
            ? priorityColor(l.rank)
            : ORIGIN_COLORS[l.origin as ExpansionNode["origin"]] ?? "#5b6cff"
        }
        onNodeClick={(n: any) => {
          if ((n as GN).url && onOpenUrl) {
            onOpenUrl((n as GN).url!);
            return;
          }
          onSelect(n.id);
        }}
        onBackgroundClick={() => onSelect("")}
        nodeCanvasObject={(n: any, ctx: CanvasRenderingContext2D, scale: number) => {
          const gn = n as GN;
          const isFocus = selectedId === n.id;
          const isFocusNeighbor = !!neighborSet && neighborSet.has(n.id) && !isFocus;
          const dim = !!selectedId && !neighborSet?.has(n.id);
          const r = Math.max(3, gn.val);

          ctx.save();
          ctx.globalAlpha = dim ? 0.22 : 1;

          if (gn.origin === "dataset") {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fillStyle = gn.color;
            ctx.fill();
            if (gn.isHub) {
              ctx.lineWidth = 1.6 / scale;
              ctx.strokeStyle = "rgba(0,0,0,0.55)";
              ctx.stroke();
            } else {
              ctx.lineWidth = 0.6 / scale;
              ctx.strokeStyle = "rgba(255,255,255,0.9)";
              ctx.stroke();
            }
          } else {
            const s = r * 0.95;
            ctx.fillStyle = gn.color;
            ctx.fillRect(n.x - s, n.y - s, s * 2, s * 2);
            ctx.lineWidth = 0.6 / scale;
            ctx.strokeStyle = "#ffffff";
            ctx.strokeRect(n.x - s, n.y - s, s * 2, s * 2);

            const ch = gn.label.charAt(0).toUpperCase();
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${Math.max(7, r * 1.1)}px system-ui`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(ch, n.x, n.y);
          }

          if (isFocus) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
            ctx.lineWidth = 1.8 / scale;
            ctx.strokeStyle = "#1c1f26";
            ctx.stroke();
          } else if (isFocusNeighbor) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r + 2, 0, Math.PI * 2);
            ctx.lineWidth = 1 / scale;
            ctx.strokeStyle = "#5b6cff";
            ctx.stroke();
          }
          ctx.restore();

          const rank = priorityRanks.get(n.id);
          const showLabel =
            isFocus ||
            gn.isHub ||
            (rank != null && rank < 6) ||
            (gn.origin !== "dataset" && !dim);
          if (showLabel && scale > 0.6) {
            ctx.save();
            ctx.globalAlpha = dim ? 0.25 : 1;
            const prefix = rank != null && rank < 9 ? `#${rank + 1} ` : "";
            const text = (prefix + gn.label).slice(0, 38);
            ctx.font = `${10 / scale}px system-ui`;
            const tw = ctx.measureText(text).width;
            ctx.fillStyle = "rgba(255,255,255,0.92)";
            ctx.fillRect(n.x + r + 3 / scale, n.y - 7 / scale, tw + 6 / scale, 14 / scale);
            ctx.strokeStyle = "rgba(28,31,38,0.12)";
            ctx.lineWidth = 0.4 / scale;
            ctx.strokeRect(n.x + r + 3 / scale, n.y - 7 / scale, tw + 6 / scale, 14 / scale);
            ctx.fillStyle = "#1c1f26";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(text, n.x + r + 6 / scale, n.y);
            ctx.restore();
          }
        }}
        nodePointerAreaPaint={(n: any, color: string, ctx: CanvasRenderingContext2D) => {
          const gn = n as GN;
          const r = Math.max(3, gn.val);
          ctx.fillStyle = color;
          if (gn.origin === "dataset") {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r + 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const s = r * 0.95 + 2;
            ctx.fillRect(n.x - s, n.y - s, s * 2, s * 2);
          }
        }}
      />

      <div
        className="absolute top-3 left-3 text-[11px] px-2.5 py-1.5 rounded-full flex items-center gap-2 pointer-events-none"
        style={{ background: "#ffffff", color: "#1c1f26", boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${expanding ? "animate-ping" : "animate-pulse"}`}
          style={{ background: expanding ? "#ef476f" : "#22c55e" }}
        />
        <span className="font-semibold">Omnilattice</span>
        <span style={{ color: "#5b6270" }}>·</span>
        <span style={{ color: "#5b6270" }}>
          {combined.nodes.length} entities · {combined.edges.length} links · {Object.keys(expByOrigin).length} sources
        </span>
      </div>

      <div
        className="absolute top-3 right-3 flex flex-col gap-1.5 pointer-events-none"
        style={{ color: "#1c1f26" }}
      >
        {Object.entries(expByOrigin).map(([origin, count]) => (
          <div
            key={origin}
            className="text-[10px] flex items-center gap-2 px-2 py-1 rounded-md"
            style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}
          >
            <span
              className="w-2 h-2 rounded-sm"
              style={{ background: ORIGIN_COLORS[origin as ExpansionNode["origin"]] }}
            />
            <span className="uppercase tracking-wider font-semibold">{origin}</span>
            <span style={{ color: "#5b6270" }}>{count}</span>
          </div>
        ))}
      </div>

      <div
        className="absolute bottom-3 left-3 text-[10px] px-2.5 py-1.5 rounded-md flex gap-3 pointer-events-none"
        style={{ background: "#ffffff", color: "#5b6270", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}
      >
        <span>click node · expand + focus</span>
        <span>click web hit · open source</span>
        <span>drag · pan</span>
        <span>scroll · zoom</span>
      </div>
    </div>
  );
}
