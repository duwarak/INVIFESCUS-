import {
  BrainEdge,
  BrainNode,
  DEFAULT_RADIAL_OPTS,
  RadialOpts,
} from "./types";

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  ring: Map<string, number>;
  centerIds: Set<string>;
  rings: { ring: number; radius: number }[];
}

interface Adj {
  out: Map<string, { target: string; weight: number }[]>;
  inc: Map<string, { source: string; weight: number }[]>;
}

function buildAdj(edges: BrainEdge[]): Adj {
  const out = new Map<string, { target: string; weight: number }[]>();
  const inc = new Map<string, { source: string; weight: number }[]>();
  for (const e of edges) {
    if (!out.has(e.source)) out.set(e.source, []);
    if (!inc.has(e.target)) inc.set(e.target, []);
    out.get(e.source)!.push({ target: e.target, weight: e.weight });
    inc.get(e.target)!.push({ source: e.source, weight: e.weight });
  }
  return { out, inc };
}

function pickCenters(nodes: BrainNode[], k: number): BrainNode[] {
  const manual = nodes.filter((n) => n.ringHint === 0);
  if (manual.length >= k) return manual.slice(0, k);
  const scored = [...nodes]
    .filter((n) => n.ringHint !== 0)
    .sort(
      (a, b) =>
        b.importance * 0.6 + b.score * 0.4 - (a.importance * 0.6 + a.score * 0.4)
    );
  return [...manual, ...scored.slice(0, k - manual.length)];
}

function bfsRings(
  centerIds: Set<string>,
  adj: Adj,
  nodes: BrainNode[],
  maxRing: number
): Map<string, number> {
  const ring = new Map<string, number>();
  const queue: string[] = [];
  for (const id of centerIds) {
    ring.set(id, 0);
    queue.push(id);
  }
  while (queue.length) {
    const id = queue.shift()!;
    const d = ring.get(id)!;
    if (d >= maxRing) continue;
    const neigh = [
      ...(adj.out.get(id) ?? []).map((e) => e.target),
      ...(adj.inc.get(id) ?? []).map((e) => e.source),
    ];
    for (const n of neigh) {
      if (!ring.has(n)) {
        ring.set(n, d + 1);
        queue.push(n);
      }
    }
  }
  for (const n of nodes) {
    if (!ring.has(n.id)) {
      const hinted = n.ringHint;
      ring.set(n.id, hinted ?? maxRing);
    }
  }
  return ring;
}

function strongestParent(
  nodeId: string,
  adj: Adj,
  ring: Map<string, number>
): string | null {
  const myRing = ring.get(nodeId) ?? 0;
  const candidates = [
    ...(adj.inc.get(nodeId) ?? []).map((e) => ({
      id: e.source,
      weight: e.weight,
    })),
    ...(adj.out.get(nodeId) ?? []).map((e) => ({
      id: e.target,
      weight: e.weight,
    })),
  ].filter((c) => (ring.get(c.id) ?? Infinity) < myRing);
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.weight - a.weight);
  return candidates[0].id;
}

function distributeWithMinGap(count: number, minGap: number): number[] {
  if (count === 0) return [];
  const span = 2 * Math.PI;
  const naturalGap = span / count;
  const gap = Math.max(naturalGap, minGap);
  return Array.from({ length: count }, (_, i) => i * gap);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function radialLayout(
  nodes: BrainNode[],
  edges: BrainEdge[],
  opts: Partial<RadialOpts> = {}
): LayoutResult {
  const o = { ...DEFAULT_RADIAL_OPTS, ...opts };
  const adj = buildAdj(edges);

  const centers = pickCenters(nodes, o.centerCount);
  const centerIds = new Set(centers.map((n) => n.id));

  const ring = bfsRings(centerIds, adj, nodes, o.maxRing);

  const preferredAngle = new Map<string, number>();
  centers.forEach((c, i) => {
    preferredAngle.set(c.id, (2 * Math.PI * i) / centers.length);
  });

  const byRing = new Map<number, BrainNode[]>();
  for (const n of nodes) {
    const r = ring.get(n.id) ?? o.maxRing;
    if (!byRing.has(r)) byRing.set(r, []);
    byRing.get(r)!.push(n);
  }

  for (let r = 1; r <= o.maxRing; r++) {
    const list = byRing.get(r) ?? [];
    for (const n of list) {
      const parent = strongestParent(n.id, adj, ring);
      const fallback = (hash(n.id + n.group) % 360) * (Math.PI / 180);
      preferredAngle.set(
        n.id,
        parent ? preferredAngle.get(parent) ?? fallback : fallback
      );
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  const rings: { ring: number; radius: number }[] = [];

  for (let r = 0; r <= o.maxRing; r++) {
    const list = (byRing.get(r) ?? []).slice();
    list.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      const ang =
        (preferredAngle.get(a.id) ?? 0) - (preferredAngle.get(b.id) ?? 0);
      if (ang !== 0) return ang;
      return b.score - a.score;
    });

    const radius = r === 0 ? 0 : o.baseR + (r - 1) * o.ringGap;
    if (r > 0) rings.push({ ring: r, radius });

    if (r === 0) {
      list.forEach((n, i) => {
        if (list.length === 1) {
          positions.set(n.id, { x: o.cx, y: o.cy });
          return;
        }
        const innerR = o.baseR * 0.35;
        const a = (2 * Math.PI * i) / list.length - Math.PI / 2;
        positions.set(n.id, {
          x: o.cx + innerR * Math.cos(a),
          y: o.cy + innerR * Math.sin(a),
        });
      });
      continue;
    }

    const minGap = (o.nodeDiameter + o.nodePadding) / radius;
    const angles = distributeWithMinGap(list.length, minGap);
    const offset = -Math.PI / 2;
    list.forEach((n, i) => {
      const a = angles[i] + offset;
      positions.set(n.id, {
        x: o.cx + radius * Math.cos(a),
        y: o.cy + radius * Math.sin(a),
      });
    });
  }

  return { positions, ring, centerIds, rings };
}
