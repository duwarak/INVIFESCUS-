import { NextRequest, NextResponse } from "next/server";
import { loadLiveSlice } from "../../../../lib/power-brain/dataset";
import { computeInsights } from "../../../../lib/power-brain/insights";
import { appendSynthesis } from "../../../../lib/power-brain/memory-store";
import { BrainEdge } from "../../../../lib/power-brain/types";

interface Body {
  nodeId: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const graph = loadLiveSlice();
  const node = graph.nodes.find((n) => n.id === body.nodeId);
  if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });

  const insights = computeInsights(graph, body.nodeId);
  if (!insights) return NextResponse.json({ error: "no insights" }, { status: 400 });

  const ts = Date.now();
  const baseSynthId = `synth-${node.id}-${ts}`;
  const createdNodeIds: string[] = [];
  const createdEdges: BrainEdge[] = [];

  const levels: { lvl: 1 | 2 | 3 | 4; label: string; neighbors: typeof insights.L1_direct }[] = [
    { lvl: 1, label: `${node.label} — direct ties`, neighbors: insights.L1_direct.slice(0, 5) },
    { lvl: 2, label: `${node.label} — two-hop reach`, neighbors: insights.L2_twoHop.slice(0, 5) },
    { lvl: 3, label: `${node.label} — cluster peers`, neighbors: insights.L3_cluster.slice(0, 4) },
    { lvl: 4, label: `${node.label} — cross-domain bridges`, neighbors: insights.L4_crossDomain.slice(0, 4) },
  ];

  for (const { lvl, label, neighbors } of levels) {
    if (!neighbors.length) continue;
    const synthId = `${baseSynthId}-L${lvl}`;
    const summary = `Level ${lvl} synthesis of "${node.label}" across ${neighbors.length} concept${neighbors.length === 1 ? "" : "s"}: ${neighbors.map((n) => n.node.label).join(", ")}.`;
    appendSynthesis(
      {
        id: synthId,
        label,
        sourceNodeId: node.id,
        group: node.group,
        level: lvl,
        summary,
        pushedAt: ts,
        pushedBy: "power-brain-live",
        evidence: neighbors.map((n) => ({
          neighborId: n.node.id,
          relation: n.relation,
          weight: n.weight,
        })),
      },
      [
        { source: node.id, target: synthId, type: "derived", weight: 0.9 },
        ...neighbors.map((n) => ({
          source: synthId,
          target: n.node.id,
          type: n.relation,
          weight: n.weight,
        })),
      ]
    );
    createdNodeIds.push(synthId);
    createdEdges.push({ source: node.id, target: synthId, type: "derived", weight: 0.9 });
    for (const n of neighbors) {
      createdEdges.push({
        source: synthId,
        target: n.node.id,
        type: n.relation,
        weight: n.weight,
      });
    }
  }

  return NextResponse.json({
    pushed: true,
    sourceNode: node.id,
    createdSynthesisNodes: createdNodeIds,
    createdEdges: createdEdges.length,
    levels: createdNodeIds.length,
  });
}
