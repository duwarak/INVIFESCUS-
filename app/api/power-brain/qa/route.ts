import { NextRequest, NextResponse } from "next/server";
import {
  loadGenealogySlice,
  loadLiveSlice,
  loadMemorySlice,
} from "../../../../lib/power-brain/dataset";
import { computeInsights } from "../../../../lib/power-brain/insights";
import { buildPersona } from "../../../../lib/power-brain/persona";
import { liveResearch } from "../../../../lib/power-brain/live-research";

function pickGraph(scope: string | null) {
  if (scope === "memory") return loadMemorySlice();
  if (scope === "genealogy") return loadGenealogySlice();
  return loadLiveSlice();
}

interface Body {
  nodeId: string;
  scope: string;
  mode: "graph" | "scenario" | "agent" | "web";
  question: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const graph = pickGraph(body.scope ?? "live");
  const node = graph.nodes.find((n) => n.id === body.nodeId);
  if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });

  const insights = computeInsights(graph, body.nodeId);
  const persona = buildPersona(node, graph, insights);

  if (body.mode === "graph") {
    const top = insights?.L1_direct.slice(0, 3) ?? [];
    const cross = insights?.L4_crossDomain.slice(0, 2) ?? [];
    return NextResponse.json({
      mode: "graph",
      answer: `Graph-grounded: "${node.label}" — ${node.summary ?? ""} Strongest direct ties: ${top.map((t) => `${t.node.label} (${t.relation}, ${(t.weight * 100).toFixed(0)}%)`).join("; ") || "none"}. Cross-domain bridges: ${cross.map((c) => `${c.node.label} in ${c.node.group}`).join(", ") || "none"}.`,
      provenance: top.map((t) => ({
        kind: "edge",
        ref: `${node.id}-[${t.relation}]->${t.node.id}`,
      })),
    });
  }

  if (body.mode === "scenario") {
    const novelty = insights?.signals.novelty ?? 0;
    return NextResponse.json({
      mode: "scenario",
      answer: `Scenario: if you remove "${node.label}" from the lattice, the ${insights?.signals.domains.length ?? 0}-domain bridge collapses, novelty signal drops from ${(novelty * 100).toFixed(0)}% to near-zero, and the agents most reliant (${(insights?.L2_twoHop ?? []).slice(0, 2).map((d) => d.node.label).join(", ") || "none"}) lose their second-hop anchor. Replay with assumption inverted to test.`,
      provenance: [{ kind: "simulation", ref: `mirofish/scenario/${node.id}` }],
    });
  }

  if (body.mode === "web") {
    const queries = Array.from(
      new Set([node.label, body.question || ""].filter(Boolean))
    );
    const results = await Promise.all(queries.map((q) => liveResearch(q)));
    const allHits = results.flatMap((r) => r.hits);
    const top = allHits.slice(0, 4);
    const synthesis = results[0]?.summary ?? "";
    const merged = top.length
      ? `${synthesis} Top hits: ${top.map((h) => `[${h.source}] ${h.title}`).join(" · ")}.`
      : synthesis;
    return NextResponse.json({
      mode: "web",
      answer: merged,
      provenance: top.map((h) => ({ kind: h.source, ref: h.url })),
      hits: allHits.slice(0, 8),
    });
  }

  return NextResponse.json({
    mode: "agent",
    speaker: persona.speakingAs,
    faction: persona.faction,
    answer: `As ${persona.speakingAs} (${persona.faction}), my stance: ${persona.stance}. Bias I'm aware of: ${persona.bias}. On your question — "${body.question || "what should I know about you?"}" — I'd answer through ${persona.knowledgeScope.slice(0, 3).join(", ") || "first-principles"}. Confidence: ${(persona.confidence * 100).toFixed(0)}%.`,
    provenance: [{ kind: "persona", ref: persona.id }],
  });
}
