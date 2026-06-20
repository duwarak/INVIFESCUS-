import { BrainEdge, BrainNode } from "./types";

export interface LayeredOpts {
  layerGap: number;
  nodeGap: number;
  topPadding: number;
}

export const DEFAULT_LAYERED_OPTS: LayeredOpts = {
  layerGap: 150,
  nodeGap: 130,
  topPadding: 0,
};

export interface LayeredResult {
  positions: Map<string, { x: number; y: number }>;
  layers: string[][];
}

function ancestryAdj(edges: BrainEdge[]) {
  const out = new Map<string, string[]>();
  const inc = new Map<string, string[]>();
  for (const e of edges) {
    if (e.type === "similar" || e.type === "bridge") continue;
    if (!out.has(e.source)) out.set(e.source, []);
    if (!inc.has(e.target)) inc.set(e.target, []);
    out.get(e.source)!.push(e.target);
    inc.get(e.target)!.push(e.source);
  }
  return { out, inc };
}

function longestPathLayers(nodes: BrainNode[], edges: BrainEdge[]) {
  const { inc } = ancestryAdj(edges);
  const layer = new Map<string, number>();
  const ids = nodes.map((n) => n.id);
  let changed = true;
  let guard = 0;
  for (const id of ids) layer.set(id, 0);
  while (changed && guard < 50) {
    changed = false;
    guard++;
    for (const id of ids) {
      const parents = inc.get(id) ?? [];
      let max = 0;
      for (const p of parents) {
        const lp = layer.get(p) ?? 0;
        if (lp + 1 > max) max = lp + 1;
      }
      if (max !== layer.get(id)) {
        layer.set(id, max);
        changed = true;
      }
    }
  }
  return layer;
}

function orderWithinLayers(
  layered: string[][],
  edges: BrainEdge[],
  nodes: BrainNode[]
) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const incFrom = new Map<string, string[]>();
  for (const e of edges) {
    if (e.type === "similar" || e.type === "bridge") continue;
    if (!incFrom.has(e.target)) incFrom.set(e.target, []);
    incFrom.get(e.target)!.push(e.source);
  }

  for (let sweep = 0; sweep < 6; sweep++) {
    for (let l = 1; l < layered.length; l++) {
      const prev = layered[l - 1];
      const prevPos = new Map(prev.map((id, i) => [id, i]));
      layered[l].sort((a, b) => {
        const pa = incFrom.get(a) ?? [];
        const pb = incFrom.get(b) ?? [];
        const avgA = pa.length
          ? pa.reduce((s, p) => s + (prevPos.get(p) ?? 0), 0) / pa.length
          : 0;
        const avgB = pb.length
          ? pb.reduce((s, p) => s + (prevPos.get(p) ?? 0), 0) / pb.length
          : 0;
        if (avgA !== avgB) return avgA - avgB;
        const ga = nodeById.get(a)?.group ?? "";
        const gb = nodeById.get(b)?.group ?? "";
        return ga.localeCompare(gb);
      });
    }
    for (let l = layered.length - 2; l >= 0; l--) {
      const next = layered[l + 1];
      const nextPos = new Map(next.map((id, i) => [id, i]));
      const outFrom = new Map<string, string[]>();
      for (const e of edges) {
        if (e.type === "similar" || e.type === "bridge") continue;
        if (!outFrom.has(e.source)) outFrom.set(e.source, []);
        outFrom.get(e.source)!.push(e.target);
      }
      layered[l].sort((a, b) => {
        const ca = outFrom.get(a) ?? [];
        const cb = outFrom.get(b) ?? [];
        const avgA = ca.length
          ? ca.reduce((s, c) => s + (nextPos.get(c) ?? 0), 0) / ca.length
          : 0;
        const avgB = cb.length
          ? cb.reduce((s, c) => s + (nextPos.get(c) ?? 0), 0) / cb.length
          : 0;
        return avgA - avgB;
      });
    }
  }
}

export function layeredLayout(
  nodes: BrainNode[],
  edges: BrainEdge[],
  opts: Partial<LayeredOpts> = {}
): LayeredResult {
  const o = { ...DEFAULT_LAYERED_OPTS, ...opts };
  const layer = longestPathLayers(nodes, edges);
  const maxLayer = Math.max(0, ...Array.from(layer.values()));
  const layered: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const n of nodes) {
    const l = layer.get(n.id) ?? 0;
    layered[l].push(n.id);
  }
  orderWithinLayers(layered, edges, nodes);

  const positions = new Map<string, { x: number; y: number }>();
  layered.forEach((row, l) => {
    const totalWidth = (row.length - 1) * o.nodeGap;
    const startX = -totalWidth / 2;
    row.forEach((id, i) => {
      positions.set(id, {
        x: startX + i * o.nodeGap,
        y: o.topPadding + l * o.layerGap,
      });
    });
  });

  return { positions, layers: layered };
}
