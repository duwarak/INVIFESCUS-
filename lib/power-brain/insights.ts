import { BrainEdge, BrainEdgeType, BrainGraph, BrainNode } from "./types";

export interface InsightNeighbor {
  node: BrainNode;
  relation: BrainEdgeType;
  weight: number;
  pathLabel?: string;
}

export interface InsightLevels {
  L1_direct: InsightNeighbor[];
  L2_twoHop: InsightNeighbor[];
  L3_cluster: InsightNeighbor[];
  L4_crossDomain: InsightNeighbor[];
  signals: {
    centrality: number;
    bridgeRatio: number;
    domains: string[];
    depth: number;
    novelty: number;
  };
}

function adj(edges: BrainEdge[]) {
  const m = new Map<string, { id: string; rel: BrainEdgeType; weight: number }[]>();
  for (const e of edges) {
    if (!m.has(e.source)) m.set(e.source, []);
    if (!m.has(e.target)) m.set(e.target, []);
    m.get(e.source)!.push({ id: e.target, rel: e.type, weight: e.weight });
    m.get(e.target)!.push({ id: e.source, rel: e.type, weight: e.weight });
  }
  return m;
}

export function computeInsights(graph: BrainGraph, nodeId: string): InsightLevels | null {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const a = adj(graph.edges);

  const direct = (a.get(nodeId) ?? []).slice().sort((x, y) => y.weight - x.weight);
  const L1_direct: InsightNeighbor[] = direct
    .map((d) => {
      const n = nodeById.get(d.id);
      if (!n) return null;
      return { node: n, relation: d.rel, weight: d.weight };
    })
    .filter(Boolean) as InsightNeighbor[];

  const seen = new Set<string>([nodeId, ...L1_direct.map((d) => d.node.id)]);
  const twoHop = new Map<
    string,
    { id: string; rel: BrainEdgeType; weight: number; via: string }
  >();
  for (const d of direct) {
    const innerEdges = a.get(d.id) ?? [];
    for (const e of innerEdges) {
      if (seen.has(e.id)) continue;
      const aggregate = d.weight * e.weight;
      const existing = twoHop.get(e.id);
      if (!existing || aggregate > existing.weight) {
        twoHop.set(e.id, {
          id: e.id,
          rel: e.rel,
          weight: aggregate,
          via: d.id,
        });
      }
    }
  }
  const L2_twoHop: InsightNeighbor[] = Array.from(twoHop.values())
    .sort((x, y) => y.weight - x.weight)
    .slice(0, 8)
    .map((d) => {
      const n = nodeById.get(d.id);
      const via = nodeById.get(d.via);
      if (!n) return null;
      return {
        node: n,
        relation: d.rel,
        weight: d.weight,
        pathLabel: via ? `via ${via.label}` : undefined,
      };
    })
    .filter(Boolean) as InsightNeighbor[];

  const sameDomainPeers = graph.nodes
    .filter((n) => n.group === node.group && n.id !== nodeId)
    .map((n) => {
      const neighborSet = new Set((a.get(nodeId) ?? []).map((x) => x.id));
      const peerNeighbors = (a.get(n.id) ?? []).map((x) => x.id);
      const shared = peerNeighbors.filter((id) => neighborSet.has(id)).length;
      return { node: n, shared };
    })
    .sort((x, y) => y.shared - x.shared || y.node.importance - x.node.importance)
    .slice(0, 6);
  const L3_cluster: InsightNeighbor[] = sameDomainPeers.map((p) => ({
    node: p.node,
    relation: "similar" as BrainEdgeType,
    weight: 0.4 + Math.min(0.5, p.shared * 0.12),
    pathLabel: p.shared ? `${p.shared} shared neighbor${p.shared === 1 ? "" : "s"}` : undefined,
  }));

  const crossDomainCandidates: Map<
    string,
    { id: string; weight: number; rel: BrainEdgeType }
  > = new Map();
  for (const d of L1_direct) {
    if (d.node.group !== node.group) {
      crossDomainCandidates.set(d.node.id, {
        id: d.node.id,
        weight: d.weight * 1.2,
        rel: d.relation,
      });
    }
  }
  for (const d of L2_twoHop) {
    if (d.node.group !== node.group) {
      const existing = crossDomainCandidates.get(d.node.id);
      const w = d.weight * 0.9;
      if (!existing || w > existing.weight) {
        crossDomainCandidates.set(d.node.id, {
          id: d.node.id,
          weight: w,
          rel: d.relation,
        });
      }
    }
  }
  const L4_crossDomain: InsightNeighbor[] = Array.from(
    crossDomainCandidates.values()
  )
    .sort((x, y) => y.weight - x.weight)
    .slice(0, 6)
    .map((c) => {
      const n = nodeById.get(c.id);
      if (!n) return null;
      return {
        node: n,
        relation: c.rel,
        weight: Math.min(1, c.weight),
        pathLabel: `${node.group} ⇌ ${n.group}`,
      };
    })
    .filter(Boolean) as InsightNeighbor[];

  const domains = Array.from(
    new Set([
      node.group,
      ...L1_direct.map((d) => d.node.group),
      ...L4_crossDomain.map((d) => d.node.group),
    ])
  );
  const bridges = L1_direct.filter((d) => d.node.group !== node.group).length;
  const bridgeRatio = L1_direct.length ? bridges / L1_direct.length : 0;
  const centrality = Math.min(1, L1_direct.length / 8);
  const depth = L2_twoHop.length ? 2 : L1_direct.length ? 1 : 0;
  const novelty = L4_crossDomain.length
    ? Math.min(
        1,
        L4_crossDomain.reduce((s, d) => s + d.weight, 0) /
          L4_crossDomain.length
      )
    : 0;

  return {
    L1_direct,
    L2_twoHop,
    L3_cluster,
    L4_crossDomain,
    signals: {
      centrality: Number(centrality.toFixed(3)),
      bridgeRatio: Number(bridgeRatio.toFixed(3)),
      domains,
      depth,
      novelty: Number(novelty.toFixed(3)),
    },
  };
}
