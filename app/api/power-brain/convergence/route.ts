import { NextRequest, NextResponse } from "next/server";
import {
  loadGenealogySlice,
  loadLiveSlice,
  loadMemorySlice,
} from "../../../../lib/power-brain/dataset";

function pickGraph(scope: string | null) {
  if (scope === "memory") return loadMemorySlice();
  if (scope === "genealogy") return loadGenealogySlice();
  return loadLiveSlice();
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");
  const graph = pickGraph(scope);

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const neighbors = new Map<string, { id: string; weight: number }[]>();
  for (const e of graph.edges) {
    if (!neighbors.has(e.source)) neighbors.set(e.source, []);
    if (!neighbors.has(e.target)) neighbors.set(e.target, []);
    neighbors.get(e.source)!.push({ id: e.target, weight: e.weight });
    neighbors.get(e.target)!.push({ id: e.source, weight: e.weight });
  }

  const hubs = graph.nodes
    .map((n) => {
      const ns = neighbors.get(n.id) ?? [];
      const groups = new Set<string>();
      let bridgeWeight = 0;
      for (const nb of ns) {
        const other = nodeById.get(nb.id);
        if (!other) continue;
        if (other.group !== n.group) {
          groups.add(other.group);
          bridgeWeight += nb.weight;
        }
      }
      const score =
        groups.size * (ns.length + 1) * (0.5 + bridgeWeight);
      return {
        id: n.id,
        label: n.label,
        group: n.group,
        type: n.type,
        neighborCount: ns.length,
        crossDomainCount: groups.size,
        bridgeWeight: Number(bridgeWeight.toFixed(2)),
        score: Number(score.toFixed(2)),
        bridgedDomains: Array.from(groups),
        summary: n.summary,
      };
    })
    .filter((h) => h.crossDomainCount >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return NextResponse.json({
    scope: scope ?? "live",
    totalNodes: graph.nodes.length,
    convergenceHubs: hubs,
    agent: "agent_convergence",
  });
}
