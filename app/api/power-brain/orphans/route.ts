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

  const incidence = new Map<string, number>();
  for (const n of graph.nodes) incidence.set(n.id, 0);
  for (const e of graph.edges) {
    incidence.set(e.source, (incidence.get(e.source) ?? 0) + 1);
    incidence.set(e.target, (incidence.get(e.target) ?? 0) + 1);
  }

  const orphans = graph.nodes
    .filter((n) => (incidence.get(n.id) ?? 0) === 0)
    .map((n) => ({
      id: n.id,
      label: n.label,
      group: n.group,
      type: n.type,
      summary: n.summary,
    }));

  const lonely = graph.nodes
    .filter((n) => {
      const c = incidence.get(n.id) ?? 0;
      return c === 1;
    })
    .map((n) => ({
      id: n.id,
      label: n.label,
      group: n.group,
      degree: 1,
    }));

  const suggestions = orphans.slice(0, 12).map((o) => {
    const candidates = graph.nodes
      .filter((m) => m.id !== o.id && m.group === o.group)
      .slice(0, 3)
      .map((m) => ({ id: m.id, label: m.label, reason: `same domain (${m.group})` }));
    return { orphan: o, candidates };
  });

  return NextResponse.json({
    scope: scope ?? "live",
    totalNodes: graph.nodes.length,
    orphanCount: orphans.length,
    lonelyCount: lonely.length,
    orphans: orphans.slice(0, 24),
    lonely: lonely.slice(0, 24),
    suggestions,
    agent: "agent_orphan_rescue",
  });
}
