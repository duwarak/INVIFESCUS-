"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import { BrainEdge, BrainNode, BrainGraph } from "../lib/power-brain/types";
import { colorFor, vibrantFor } from "../lib/power-brain/colors";
import {
  CentralityIndex,
  computeCentrality,
  deepenForCentrality,
  neighborsByPriority,
} from "../lib/power-brain/centrality";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export interface LiveHit {
  id: string;
  label: string;
  source: "openalex" | "wikipedia" | "arxiv";
  url: string;
  parentId: string;
  ts: number;
}

interface GNode {
  id: string;
  label: string;
  group: string;
  type: string;
  color: string;
  val: number;
  isHit?: boolean;
  isHub?: boolean;
  url?: string;
  source?: LiveHit["source"];
  parentId?: string;
  centrality?: number;
}

interface GLink {
  source: string;
  target: string;
  type: string;
  weight: number;
  priority?: number;
  rank?: number;
  isHit?: boolean;
  isFocus?: boolean;
}

interface Props {
  nodes: BrainNode[];
  edges: BrainEdge[];
  liveHits?: LiveHit[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onHitOpen?: (hit: LiveHit) => void;
  showLabels?: boolean;
  dim?: "2d" | "3d";
}

const SRC_COLOR: Record<LiveHit["source"], string> = {
  openalex: "#0ea5e9",
  wikipedia: "#9b6dff",
  arxiv: "#ef476f",
};

const meshCache = new Map<string, THREE.Group>();

function buildMesh(n: GNode, isFocus: boolean, isFocusNeighbor: boolean): THREE.Object3D {
  const key = `${n.color}-${n.val.toFixed(2)}-${isFocus ? "f" : isFocusNeighbor ? "n" : "."}-${n.isHit ? "h" : "."}-${n.isHub ? "H" : "."}`;
  if (meshCache.has(key)) return meshCache.get(key)!.clone();

  const group = new THREE.Group();
  const r = Math.max(2.5, n.val);

  const coreGeo = new THREE.SphereGeometry(r, 20, 20);
  const coreMat = new THREE.MeshPhongMaterial({
    color: n.color,
    emissive: n.color,
    emissiveIntensity: isFocus ? 1.0 : n.isHub ? 0.85 : 0.55,
    shininess: n.isHub ? 90 : 60,
    transparent: true,
    opacity: 0.96,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  if (n.isHub) {
    const ringGeo = new THREE.RingGeometry(r * 1.1, r * 1.18, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);
  }

  const haloGeo = new THREE.SphereGeometry(r * 1.7, 14, 14);
  const haloMat = new THREE.MeshBasicMaterial({
    color: n.color,
    transparent: true,
    opacity: isFocus ? 0.34 : isFocusNeighbor ? 0.26 : n.isHit ? 0.22 : n.isHub ? 0.2 : 0.13,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  group.add(halo);

  if (n.isHit) {
    const ringGeo = new THREE.RingGeometry(r * 1.9, r * 2.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(ringGeo, ringMat));
  }

  meshCache.set(key, group);
  return group.clone();
}

function priorityColor(rank: number): string {
  if (rank === 0) return "#ffffff";
  if (rank === 1) return "#fbbf24";
  if (rank === 2) return "#f97316";
  if (rank <= 4) return "#ec4899";
  if (rank <= 7) return "#a855f7";
  return "#3b82f6";
}

export default function ForceGraph3DCanvas({
  nodes,
  edges,
  liveHits = [],
  selectedId,
  onSelect,
  onHitOpen,
  showLabels = true,
  dim = "3d",
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

  const centrality: CentralityIndex = useMemo(() => {
    const baseGraph: BrainGraph = {
      nodes: [...nodes, ...liveHits.map((h) => ({
        id: h.id,
        label: h.label,
        group: h.source,
        type: "concept" as const,
        score: 0.4,
        importance: 0.3,
        ts: h.ts,
      }))],
      edges: [
        ...edges,
        ...liveHits.map((h) => ({
          source: h.parentId,
          target: h.id,
          type: "derived" as const,
          weight: 0.8,
        })),
      ],
    };
    return computeCentrality(baseGraph);
  }, [nodes, edges, liveHits]);

  const priorityRanks = useMemo(() => {
    if (!selectedId) return new Map<string, number>();
    const composite: BrainGraph = {
      nodes: [...nodes, ...liveHits.map((h) => ({
        id: h.id, label: h.label, group: h.source, type: "concept" as const,
        score: 0.4, importance: 0.3, ts: h.ts,
      }))],
      edges: [
        ...edges,
        ...liveHits.map((h) => ({ source: h.parentId, target: h.id, type: "derived" as const, weight: 0.8 })),
      ],
    };
    const ordered = neighborsByPriority(composite, centrality, selectedId);
    return new Map(ordered.map((n) => [n.id, n.rank]));
  }, [selectedId, nodes, edges, liveHits, centrality]);

  const graphData = useMemo(() => {
    const gNodes: GNode[] = nodes.map((n) => {
      const c = centrality.map.get(n.id);
      const base = vibrantFor(n.group, n.id);
      const color = c ? deepenForCentrality(base, c.norm) : base;
      return {
        id: n.id,
        label: n.label,
        group: n.group,
        type: n.type,
        color,
        val: 2.5 + n.importance * 4.5 + (c?.norm ?? 0) * 3.5,
        isHub: c?.isHub ?? false,
        centrality: c?.norm ?? 0,
      };
    });
    for (const h of liveHits) {
      gNodes.push({
        id: h.id,
        label: h.label,
        group: h.source,
        type: "hit",
        color: SRC_COLOR[h.source],
        val: 2.8,
        isHit: true,
        url: h.url,
        source: h.source,
        parentId: h.parentId,
      });
    }
    const presentIds = new Set(gNodes.map((g) => g.id));
    const gLinks: GLink[] = edges
      .filter((e) => presentIds.has(e.source) && presentIds.has(e.target))
      .map((e) => {
        const rank = priorityRanks.get(
          e.source === selectedId ? e.target : e.target === selectedId ? e.source : ""
        );
        const isFocus = selectedId === e.source || selectedId === e.target;
        return {
          source: e.source,
          target: e.target,
          type: e.type,
          weight: e.weight,
          rank: rank,
          isFocus,
        };
      });
    for (const h of liveHits) {
      const rank = priorityRanks.get(selectedId === h.parentId ? h.id : "");
      gLinks.push({
        source: h.parentId,
        target: h.id,
        type: "derived",
        weight: 0.8,
        isHit: true,
        rank: rank,
        isFocus: selectedId === h.parentId || selectedId === h.id,
      });
    }
    return { nodes: gNodes, links: gLinks };
  }, [nodes, edges, liveHits, centrality, priorityRanks, selectedId]);

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
    const node: any = graphData.nodes.find((n) => n.id === selectedId);
    if (!node || node.x == null) return;
    if (dim === "3d") {
      const dist = 220;
      const r = Math.hypot(node.x, node.y, node.z ?? 0) || 1;
      const factor = 1 + dist / r;
      ref.current.cameraPosition(
        { x: node.x * factor, y: node.y * factor, z: (node.z ?? 0) * factor },
        { x: node.x, y: node.y, z: node.z ?? 0 },
        1500
      );
    } else if (ref.current.centerAt) {
      ref.current.centerAt(node.x, node.y, 1200);
      ref.current.zoom(2.4, 1200);
    }
  }, [selectedId, graphData.nodes, dim]);

  const sharedProps = {
    graphData,
    width: size.w,
    height: size.h,
    backgroundColor: "#04050a",
    nodeOpacity: 1,
    linkOpacity: 0.45,
    linkColor: (l: any) => {
      if (l.isFocus && l.rank != null) return priorityColor(l.rank);
      if (l.isHit) return "#ffffff";
      if (l.type === "bridge") return "#7c5cfc";
      return "#3b82f6";
    },
    linkWidth: (l: any) => {
      if (l.isFocus && l.rank != null) {
        return Math.max(0.6, 4.5 - l.rank * 0.45);
      }
      return neighborSet &&
        (neighborSet.has((l.source as any).id ?? l.source) ||
          neighborSet.has((l.target as any).id ?? l.target))
        ? 1.4
        : 0.4;
    },
    linkDirectionalParticles: (l: any) => (l.isHit ? 2 : l.isFocus && (l.rank ?? 99) < 3 ? 1 : 0),
    linkDirectionalParticleSpeed: 0.012,
    linkDirectionalParticleWidth: 2,
    linkDirectionalParticleColor: (l: any) =>
      l.isFocus && l.rank != null ? priorityColor(l.rank) : "#ffffff",
    onNodeClick: (n: any) => {
      if ((n as GNode).isHit && (n as GNode).url && onHitOpen) {
        onHitOpen({
          id: n.id,
          label: (n as GNode).label,
          source: (n as GNode).source!,
          url: (n as GNode).url!,
          parentId: (n as GNode).parentId!,
          ts: Date.now(),
        });
        return;
      }
      onSelect?.(n.id);
    },
    onBackgroundClick: () => onSelect?.(""),
    cooldownTicks: Infinity as any,
    warmupTicks: 60,
  };

  return (
    <div ref={wrapRef} className="w-full h-full relative overflow-hidden" style={{ background: "#04050a" }}>
      {dim === "3d" ? (
        <ForceGraph3D
          ref={ref}
          {...sharedProps}
          showNavInfo={false}
          nodeResolution={16}
          d3AlphaDecay={0.012}
          d3VelocityDecay={0.32}
          nodeThreeObject={(n: any) => {
            const isFocus = selectedId === n.id;
            const isFocusNeighbor = !!neighborSet && neighborSet.has(n.id) && !isFocus;
            const obj = buildMesh(n as GNode, isFocus, isFocusNeighbor);
            if (showLabels && (isFocus || (n as GNode).isHit || (n as GNode).isHub)) {
              const rank = priorityRanks.get(n.id);
              const prefix = rank != null && rank < 9 ? `#${rank + 1} · ` : "";
              const sprite = new SpriteText(prefix + (n as GNode).label.slice(0, 28));
              sprite.color = "#e6e8ee";
              sprite.backgroundColor = "rgba(10,12,20,0.92)";
              sprite.borderColor = (n as GNode).color;
              sprite.borderWidth = 0.6;
              sprite.padding = 2;
              sprite.textHeight = 4;
              sprite.position.set(0, (n.val ?? 4) + 6, 0);
              (sprite.material as any).depthTest = false;
              sprite.renderOrder = 10;
              obj.add(sprite);
            }
            return obj;
          }}
          nodeThreeObjectExtend={false}
        />
      ) : (
        <ForceGraph2D
          ref={ref}
          {...sharedProps}
          d3AlphaDecay={0.012}
          d3VelocityDecay={0.32}
          nodeCanvasObject={(n: any, ctx: CanvasRenderingContext2D, scale: number) => {
            const gn = n as GNode;
            const isFocus = selectedId === n.id;
            const isFocusNeighbor = !!neighborSet && neighborSet.has(n.id) && !isFocus;
            const r = Math.max(2.5, gn.val);
            ctx.save();
            ctx.shadowColor = gn.color;
            ctx.shadowBlur = isFocus ? 22 : gn.isHub ? 14 : isFocusNeighbor ? 12 : 6;
            ctx.fillStyle = gn.color;
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fill();
            if (gn.isHub) {
              ctx.shadowBlur = 0;
              ctx.lineWidth = 1.4 / scale;
              ctx.strokeStyle = "rgba(0,0,0,0.6)";
              ctx.stroke();
            }
            if (isFocus) {
              ctx.shadowBlur = 0;
              ctx.lineWidth = 1.4 / scale;
              ctx.strokeStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();

            const rank = priorityRanks.get(n.id);
            if (showLabels && (isFocus || gn.isHit || gn.isHub || (rank != null && rank < 5))) {
              ctx.save();
              const prefix = rank != null && rank < 9 ? `#${rank + 1} · ` : "";
              const text = prefix + gn.label.slice(0, 26);
              ctx.font = `${10 / scale}px system-ui`;
              const w = ctx.measureText(text).width;
              ctx.fillStyle = "rgba(10,12,20,0.92)";
              ctx.fillRect(n.x + r + 2, n.y - 6 / scale, w + 6 / scale, 12 / scale);
              ctx.fillStyle = "#e6e8ee";
              ctx.textBaseline = "middle";
              ctx.fillText(text, n.x + r + 5 / scale, n.y);
              ctx.restore();
            }
          }}
        />
      )}
      <div
        className="absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold flex items-center gap-2 pointer-events-none"
        style={{ background: "rgba(255,255,255,0.06)", color: "#e2e8f0" }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
        Force-Graph {dim.toUpperCase()} · centrality-weighted · click for priority edges
      </div>
      <div
        className="absolute bottom-3 left-3 text-[10px] px-2 py-1 rounded-md flex gap-3 pointer-events-none"
        style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}
      >
        <span>drag · {dim === "3d" ? "orbit" : "pan"}</span>
        <span>scroll · zoom</span>
        <span>click node · focus + priority</span>
        <span>click hit · open source</span>
      </div>
      {selectedId && (
        <div
          className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-md flex gap-2 items-center pointer-events-none"
          style={{ background: "rgba(255,255,255,0.06)", color: "#e2e8f0" }}
        >
          <span>Priority:</span>
          {[0, 1, 2, 4, 7].map((rk) => (
            <span key={rk} className="flex items-center gap-1">
              <span className="w-3 h-1 rounded-sm" style={{ background: priorityColor(rk) }} />
              <span style={{ color: "#94a3b8" }}>#{rk + 1}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
