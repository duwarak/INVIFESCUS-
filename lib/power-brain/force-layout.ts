import { BrainEdge, BrainNode } from "./types";

export interface ForceOpts {
  iterations: number;
  width: number;
  height: number;
  charge: number;
  springRest: number;
  springK: number;
  centerStrength: number;
  groupStrength: number;
  damping: number;
}

export const DEFAULT_FORCE_OPTS: ForceOpts = {
  iterations: 220,
  width: 2400,
  height: 1600,
  charge: 2400,
  springRest: 110,
  springK: 0.012,
  centerStrength: 0.0015,
  groupStrength: 0.004,
  damping: 0.86,
};

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function seededRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
}

export function forceLayout(
  nodes: BrainNode[],
  edges: BrainEdge[],
  opts: Partial<ForceOpts> = {}
): Map<string, { x: number; y: number }> {
  const o = { ...DEFAULT_FORCE_OPTS, ...opts };
  const rng = seededRng(1337);
  const idx = new Map<string, number>();
  const arr: P[] = nodes.map((n, i) => {
    idx.set(n.id, i);
    const a = rng() * 2 * Math.PI;
    const r = 50 + rng() * Math.min(o.width, o.height) * 0.35;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0 };
  });

  const groupCenters = new Map<string, { x: number; y: number; n: number }>();

  const edgeIdx: { a: number; b: number; k: number; rest: number }[] = [];
  for (const e of edges) {
    const a = idx.get(e.source);
    const b = idx.get(e.target);
    if (a == null || b == null) continue;
    edgeIdx.push({
      a,
      b,
      k: o.springK * (0.5 + e.weight),
      rest: o.springRest,
    });
  }

  const groupOf = nodes.map((n) => n.group);

  for (let it = 0; it < o.iterations; it++) {
    groupCenters.clear();
    for (let i = 0; i < arr.length; i++) {
      const g = groupOf[i];
      const c = groupCenters.get(g) ?? { x: 0, y: 0, n: 0 };
      c.x += arr[i].x;
      c.y += arr[i].y;
      c.n += 1;
      groupCenters.set(g, c);
    }
    for (const c of groupCenters.values()) {
      c.x /= c.n;
      c.y /= c.n;
    }

    const cool = 1 - it / o.iterations;
    const minDist = 18;

    for (let i = 0; i < arr.length; i++) {
      let fx = 0;
      let fy = 0;
      const pi = arr[i];
      for (let j = 0; j < arr.length; j++) {
        if (i === j) continue;
        const pj = arr[j];
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const d2 = dx * dx + dy * dy + 0.01;
        const d = Math.sqrt(d2);
        if (d > 600) continue;
        const f = o.charge / d2;
        fx += (dx / d) * f;
        fy += (dy / d) * f;
        if (d < minDist) {
          const overlap = (minDist - d) * 0.6;
          fx += (dx / d) * overlap;
          fy += (dy / d) * overlap;
        }
      }

      fx -= pi.x * o.centerStrength * arr.length;
      fy -= pi.y * o.centerStrength * arr.length;

      const gc = groupCenters.get(groupOf[i])!;
      fx -= (pi.x - gc.x) * o.groupStrength;
      fy -= (pi.y - gc.y) * o.groupStrength;

      pi.vx = (pi.vx + fx * cool) * o.damping;
      pi.vy = (pi.vy + fy * cool) * o.damping;
    }

    for (const e of edgeIdx) {
      const pa = arr[e.a];
      const pb = arr[e.b];
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const d = Math.sqrt(dx * dx + dy * dy + 0.01);
      const f = (d - e.rest) * e.k;
      const ux = dx / d;
      const uy = dy / d;
      pa.vx += ux * f * cool;
      pa.vy += uy * f * cool;
      pb.vx -= ux * f * cool;
      pb.vy -= uy * f * cool;
    }

    for (const p of arr) {
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => positions.set(n.id, { x: arr[i].x, y: arr[i].y }));
  return positions;
}
