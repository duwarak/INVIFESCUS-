import { BrainEdge, BrainGraph, BrainNode } from "./types";

export interface CentralitySignal {
  degree: number;
  weighted: number;
  crossDomain: number;
  domains: string[];
  norm: number;
  rank: number;
  isHub: boolean;
}

export interface CentralityIndex {
  map: Map<string, CentralitySignal>;
  maxDegree: number;
  maxWeighted: number;
}

export function computeCentrality(graph: BrainGraph): CentralityIndex {
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const sig = new Map<
    string,
    { degree: number; weighted: number; cross: number; groups: Set<string>; group: string }
  >();
  for (const n of graph.nodes) {
    sig.set(n.id, { degree: 0, weighted: 0, cross: 0, groups: new Set(), group: n.group });
  }
  for (const e of graph.edges) {
    const a = sig.get(e.source);
    const b = sig.get(e.target);
    if (!a || !b) continue;
    a.degree += 1;
    b.degree += 1;
    a.weighted += e.weight;
    b.weighted += e.weight;
    const na = nodeById.get(e.source)!;
    const nb = nodeById.get(e.target)!;
    if (na.group !== nb.group) {
      a.cross += 1;
      b.cross += 1;
      a.groups.add(nb.group);
      b.groups.add(na.group);
    }
  }

  let maxDegree = 0;
  let maxWeighted = 0;
  for (const s of sig.values()) {
    if (s.degree > maxDegree) maxDegree = s.degree;
    if (s.weighted > maxWeighted) maxWeighted = s.weighted;
  }

  const ranked = [...sig.entries()].sort((a, b) => b[1].weighted - a[1].weighted);
  const map = new Map<string, CentralitySignal>();
  const hubCount = Math.max(3, Math.floor(graph.nodes.length * 0.06));
  ranked.forEach(([id, s], rank) => {
    map.set(id, {
      degree: s.degree,
      weighted: Number(s.weighted.toFixed(3)),
      crossDomain: s.cross,
      domains: Array.from(s.groups),
      norm: maxWeighted ? Number((s.weighted / maxWeighted).toFixed(3)) : 0,
      rank,
      isHub: rank < hubCount,
    });
  });

  return { map, maxDegree, maxWeighted };
}

export interface PriorityNeighbor {
  id: string;
  weight: number;
  edgeType: BrainEdge["type"];
  priority: number;
  rank: number;
  centralityNorm: number;
}

export function neighborsByPriority(
  graph: BrainGraph,
  centrality: CentralityIndex,
  nodeId: string
): PriorityNeighbor[] {
  const candidates: PriorityNeighbor[] = [];
  for (const e of graph.edges) {
    let otherId: string | null = null;
    if (e.source === nodeId) otherId = e.target;
    else if (e.target === nodeId) otherId = e.source;
    if (!otherId) continue;
    const otherSig = centrality.map.get(otherId);
    if (!otherSig) continue;
    const priority = e.weight * (0.4 + otherSig.norm * 0.6);
    candidates.push({
      id: otherId,
      weight: e.weight,
      edgeType: e.type,
      priority,
      rank: 0,
      centralityNorm: otherSig.norm,
    });
  }
  candidates.sort((a, b) => b.priority - a.priority);
  candidates.forEach((c, i) => (c.rank = i));
  return candidates;
}

export function deepenForCentrality(baseHsl: string, norm: number): string {
  const m = /^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)$/.exec(
    baseHsl
  );
  if (!m) return baseHsl;
  const h = parseFloat(m[1]);
  let s = parseFloat(m[2]);
  let l = parseFloat(m[3]);
  s = Math.min(100, s + norm * 18);
  l = Math.max(34, l - norm * 22);
  return `hsl(${h.toFixed(0)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}
