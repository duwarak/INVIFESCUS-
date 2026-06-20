import { NextRequest, NextResponse } from "next/server";
import {
  loadAgents,
  loadGenealogySlice,
  loadLiveSlice,
  loadMemorySlice,
  pickFlowForRelation,
} from "../../../../lib/power-brain/dataset";
import {
  BrainEdge,
  BrainEdgeType,
  BrainNode,
  ExplainResponse,
} from "../../../../lib/power-brain/types";

function pickGraph(scope: string | null) {
  if (scope === "memory") return loadMemorySlice();
  if (scope === "genealogy") return loadGenealogySlice();
  return loadLiveSlice();
}

function buildNarrative(
  node: BrainNode,
  neighbors: { node: BrainNode; relation: BrainEdgeType; weight: number; description: string }[]
): string {
  if (!neighbors.length) {
    return `"${node.label}" sits in ${node.group} as a standalone ${node.type}. MemPalace has no recorded edges to other domains yet — MiroFish's Cross-Domain Synthesis Agent recommends capturing more context so it can be bridged.`;
  }

  const top = neighbors.slice(0, 3);
  const domains = Array.from(new Set(top.map((n) => n.node.group))).filter((g) => g !== node.group);
  const strongest = top[0];

  const flow = pickFlowForRelation(strongest.relation);
  const lead =
    `"${node.label}" (${node.group}) is most strongly tied to "${strongest.node.label}" via ${strongest.relation} ` +
    `(${(strongest.weight * 100).toFixed(0)}% confidence). ${strongest.description ? `Rationale: ${strongest.description}.` : ""}`;

  const cross = domains.length
    ? `MiroFish's Cross-Domain Synthesis Agent reads ${domains.length} bridge${domains.length === 1 ? "" : "s"} into ${domains.join(", ")} — the polymath pattern the Universal Mind Map exists to surface.`
    : `The strongest ties stay inside ${node.group}, suggesting a within-domain cluster.`;

  const flowLine = flow
    ? `Pipeline triggered: ${flow.flow_name}. ${flow.steps.slice(0, 3).map((s) => `${s.agent}→${s.action}`).join(" · ")}.`
    : "";

  return [lead, cross, flowLine].filter(Boolean).join(" ");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const scope = url.searchParams.get("scope");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const graph = pickGraph(scope);
  const node = graph.nodes.find((n) => n.id === id);
  if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const rawEdges: { e: BrainEdge; otherId: string; description: string }[] = [];

  for (const e of graph.edges) {
    if (e.source === id || e.target === id) {
      const otherId = e.source === id ? e.target : e.source;
      rawEdges.push({ e, otherId, description: "" });
    }
  }
  rawEdges.sort((a, b) => b.e.weight - a.e.weight);

  const neighbors = rawEdges
    .map(({ e, otherId, description }) => {
      const n = nodeById.get(otherId);
      if (!n) return null;
      return { node: n, relation: e.type, weight: e.weight, description };
    })
    .filter(Boolean) as {
    node: BrainNode;
    relation: BrainEdgeType;
    weight: number;
    description: string;
  }[];

  const agents = loadAgents();
  const flow = pickFlowForRelation(neighbors[0]?.relation ?? "similar");

  const response: ExplainResponse = {
    node,
    neighbors: neighbors.map((n) => ({
      node: n.node,
      relation: n.relation,
      weight: n.weight,
    })),
    narrative: buildNarrative(node, neighbors),
    sources: [
      { kind: "mempalace", ref: `wing:${node.group}/room:${node.type}` },
      {
        kind: "mirofish",
        ref: flow ? `${flow.flow_name} · ${flow.steps.length} steps` : "persona-swarm",
      },
      { kind: "rag", ref: `agents:${agents.length} (${agents.map((a) => a.id.replace("agent_", "")).join(",")})` },
      { kind: "chatbot", ref: `summary:${(node.summary ?? "").slice(0, 80)}` },
    ],
  };

  return NextResponse.json(response);
}
