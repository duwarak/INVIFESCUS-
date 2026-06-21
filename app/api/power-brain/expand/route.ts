import { NextRequest, NextResponse } from "next/server";
import {
  loadFullGraph,
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

interface ExNode {
  id: string;
  label: string;
  group: string;
  type: string;
  origin: "dataset" | "memory" | "openalex" | "wikipedia" | "arxiv" | "persona" | "crossdomain";
  url?: string;
  summary?: string;
  importance: number;
}

interface ExEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
  origin: string;
}

interface AgentTrace {
  agent: string;
  action: string;
  produced: number;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const scope = url.searchParams.get("scope");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const scopeGraph = pickGraph(scope);
  const full = loadFullGraph();
  const node = scopeGraph.nodes.find((n) => n.id === id) ?? full.nodes.find((n) => n.id === id);
  if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });

  const insights = computeInsights(scopeGraph, id);
  const persona = buildPersona(node, scopeGraph, insights);

  const newNodes: ExNode[] = [];
  const newEdges: ExEdge[] = [];
  const trace: AgentTrace[] = [];
  const seen = new Set<string>([id]);

  const memorySiblings = (insights?.L2_twoHop ?? []).slice(0, 6);
  for (const s of memorySiblings) {
    if (seen.has(s.node.id)) continue;
    seen.add(s.node.id);
    newNodes.push({
      id: s.node.id,
      label: s.node.label,
      group: s.node.group,
      type: s.node.type,
      origin: "memory",
      summary: s.node.summary,
      importance: s.node.importance,
    });
    newEdges.push({
      source: id,
      target: s.node.id,
      type: s.relation,
      weight: s.weight,
      label: `${s.relation} · 2-hop`,
      origin: "memory",
    });
  }
  trace.push({
    agent: "Personal Knowledge Agent",
    action: "Pulled 2-hop MemPalace siblings",
    produced: memorySiblings.length,
  });

  const crossDomain = (insights?.L4_crossDomain ?? []).slice(0, 4);
  for (const c of crossDomain) {
    if (seen.has(c.node.id)) continue;
    seen.add(c.node.id);
    newNodes.push({
      id: c.node.id,
      label: c.node.label,
      group: c.node.group,
      type: c.node.type,
      origin: "crossdomain",
      summary: c.node.summary,
      importance: c.node.importance,
    });
    newEdges.push({
      source: id,
      target: c.node.id,
      type: "bridge",
      weight: c.weight,
      label: `bridge · ${node.group} ⇌ ${c.node.group}`,
      origin: "crossdomain",
    });
  }
  trace.push({
    agent: "Cross-Domain Synthesis Agent",
    action: "Surfaced cross-domain bridges",
    produced: crossDomain.length,
  });

  const research = await liveResearch(node.label);
  const hits = research.hits.slice(0, 8);
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    const hid = `web-${node.id}-${h.source}-${i}-${Date.now()}`;
    newNodes.push({
      id: hid,
      label: h.title.slice(0, 64),
      group: h.source,
      type: "source",
      origin: h.source,
      url: h.url,
      summary: h.snippet,
      importance: h.source === "openalex" ? 0.85 : 0.65,
    });
    newEdges.push({
      source: id,
      target: hid,
      type: "derived",
      weight: 0.7 + i * -0.04,
      label: `${h.source}${h.year ? ` · ${h.year}` : ""}`,
      origin: h.source,
    });
  }
  trace.push({
    agent: "Research Synthesis Agent",
    action: "Fetched OpenAlex + Wikipedia + arXiv in parallel",
    produced: hits.length,
  });

  const factionNodes = persona.factions.slice(0, 3);
  for (const f of factionNodes) {
    const fid = `persona-${id}-${f.replace(/\W/g, "")}`;
    if (seen.has(fid)) continue;
    seen.add(fid);
    newNodes.push({
      id: fid,
      label: f,
      group: "persona",
      type: "person",
      origin: "persona",
      summary: `Persona coalition derived from ${node.label} via MiroFish persona layer.`,
      importance: 0.55,
    });
    newEdges.push({
      source: id,
      target: fid,
      type: "similar",
      weight: 0.6,
      label: "persona coalition",
      origin: "persona",
    });
  }
  trace.push({
    agent: "MiroFish Persona Layer",
    action: "Bound coalitions / factions to the concept",
    produced: factionNodes.length,
  });

  return NextResponse.json({
    rootId: id,
    rootLabel: node.label,
    rootGroup: node.group,
    newNodes,
    newEdges,
    trace,
    totals: {
      memory: memorySiblings.length,
      crossDomain: crossDomain.length,
      web: hits.length,
      persona: factionNodes.length,
      total: newNodes.length,
    },
  });
}
