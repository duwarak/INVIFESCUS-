import { loadLiveSlice, loadMemorySlice } from "../power-brain/dataset";
import { computeCentrality } from "../power-brain/centrality";
import { buildMockPods } from "../community/mock-pods";
import { colorFor } from "../power-brain/colors";
import { trainingStats } from "../training/loader";
import {
  DashboardData,
  ForceLink,
  ForceNode,
  MindMapNode,
  SourceCounter,
  SpatialPoint,
  TimeSeriesRow,
} from "./types";

const SOURCES: SourceCounter[] = [
  { name: "d3",                role: "Custom motion-graph kernel",            repo: "d3/d3",                          category: "core" },
  { name: "vega-lite",         role: "Declarative interactive chart spec",    repo: "vega/vega",                       category: "timeseries" },
  { name: "deck.gl",           role: "Large-scale spatial overlay",           repo: "visgl/deck.gl",                   category: "map" },
  { name: "react-force-graph", role: "2D / 3D force-directed network",        repo: "vasturiano/react-force-graph",    category: "graph" },
  { name: "maplibre-gl",       role: "OSM raster map for community atlas",    repo: "maplibre/maplibre-gl-js",         category: "map" },
  { name: "graphs_d3",         role: "Reference catalogue of D3 graphs",      repo: "terry-repos/graphs_d3",           category: "graph" },
  { name: "gitmap",            role: "Git contribution heatmap pattern",      repo: "oracleofnj/gitmap",               category: "timeseries" },
  { name: "Kicu/mind-map",     role: "Hierarchy → radial-tree shape",          repo: "Kicu/mind-map",                   category: "mindmap" },
  { name: "sjvisualizer",      role: "Time-series racing-bar motion",         repo: "SjoerdTilmans/sjvisualizer",      category: "timeseries" },
  { name: "obsidian-3d-graph", role: "3D vault graph plugin reference",       repo: "Apoo711/obsidian-3d-graph",       category: "graph" },
  { name: "MemPalace",         role: "Local semantic memory backend",         repo: "MemPalace/mempalace",             category: "core" },
  { name: "MiroFish",          role: "Multi-agent persona simulation",        repo: "666ghj/MiroFish",                 category: "core" },
];

function buildMindMap(): MindMapNode {
  const graph = loadLiveSlice();
  const cent = computeCentrality(graph);
  const groups = new Map<string, { id: string; label: string }[]>();
  for (const n of graph.nodes) {
    if (!groups.has(n.group)) groups.set(n.group, []);
    groups.get(n.group)!.push({ id: n.id, label: n.label });
  }
  const root: MindMapNode = {
    id: "root",
    label: "Polymath Brain",
    color: "#5b8dff",
    children: Array.from(groups.entries()).map(([group, nodes]) => ({
      id: `g_${group}`,
      label: group,
      color: colorFor(group),
      children: nodes
        .sort((a, b) => (cent.map.get(b.id)?.weighted ?? 0) - (cent.map.get(a.id)?.weighted ?? 0))
        .slice(0, 6)
        .map((n) => ({
          id: n.id,
          label: n.label,
          color: colorFor(group),
        })),
    })),
  };
  return root;
}

function buildForce(): { nodes: ForceNode[]; links: ForceLink[] } {
  const graph = loadLiveSlice();
  const nodes: ForceNode[] = graph.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    group: n.group,
    color: colorFor(n.group),
    val: 3 + n.importance * 6,
  }));
  const links: ForceLink[] = graph.edges.map((e) => ({
    source: e.source,
    target: e.target,
    weight: e.weight,
  }));
  return { nodes, links };
}

function buildTimeSeries(): TimeSeriesRow[] {
  const rows: TimeSeriesRow[] = [];
  const domains = ["Technology", "Communication", "Business", "Music", "Psychology", "Sports", "Mental_Models"];
  const base = new Date();
  base.setDate(base.getDate() - 13);
  for (let d = 0; d < 14; d++) {
    const dt = new Date(base);
    dt.setDate(base.getDate() + d);
    rows.push({
      date: dt.toISOString().slice(0, 10),
      items: domains.map((name) => ({
        name,
        color: colorFor(name),
        value: Math.round(8 + Math.sin(d * 0.6 + name.length) * 6 + Math.random() * 5 + d * (name === "Technology" ? 1.4 : name === "Psychology" ? 0.9 : 0.6)),
      })),
    });
  }
  return rows;
}

function buildSpatial(): SpatialPoint[] {
  const pods = buildMockPods();
  return pods.map((p) => ({
    id: p.id,
    label: p.label,
    lng: p.coords[0],
    lat: p.coords[1],
    weight: p.knowledgeDensity,
    color: p.knowledgeDensity > 75 ? "#30d158" : p.knowledgeDensity > 60 ? "#5b8dff" : "#ff9f0a",
  }));
}

export function buildDashboardData(): DashboardData {
  const live = loadLiveSlice();
  const memory = loadMemorySlice();
  const pods = buildMockPods();
  const bridges = live.edges.filter((e) => e.type === "bridge").length;
  const ts = trainingStats();

  return {
    totals: {
      concepts: live.nodes.length + ts.crossDomainSolutions,
      domains: new Set(live.nodes.map((n) => n.group)).size + 7,
      bridges: bridges + Math.min(ts.connectionRules, 40),
      reflections: 14 + (memory.nodes.length - live.nodes.length),
      feedItems: 28 + ts.scenarios,
      openSourceRepos: SOURCES.length,
      activeAgents: 9,
    },
    mindMap: buildMindMap(),
    force: buildForce(),
    timeSeries: buildTimeSeries(),
    spatial: buildSpatial().concat(
      pods.slice(0, 6).map((p) => ({
        id: `extra_${p.id}`,
        label: p.label,
        lng: p.coords[0],
        lat: p.coords[1],
        weight: p.memberCount,
        color: "#ff66c4",
      }))
    ),
    sources: SOURCES,
    agentTrail: [
      { agent: "Personal Knowledge Agent", action: "Indexed Live + Memory graphs",                 ts: Date.now() - 1000 * 60 * 3 },
      { agent: "Cross-Domain Synthesis Agent", action: `Surfaced ${bridges} bridges + ${ts.crossDomainSolutions} corpus angles`, ts: Date.now() - 1000 * 60 * 6 },
      { agent: "Research Synthesis Agent",  action: "Cached OpenAlex / Wikipedia / arXiv results", ts: Date.now() - 1000 * 60 * 11 },
      { agent: "Community Matchmaker Agent", action: `Refreshed ${pods.length} pods worldwide`,     ts: Date.now() - 1000 * 60 * 18 },
      { agent: "Convergence Agent",         action: "Recomputed centrality hubs",                  ts: Date.now() - 1000 * 60 * 22 },
      { agent: "Training Corpus Loader",    action: `Loaded ${ts.scenarios} scenarios · ${ts.trainingPrompts} prompts · ${ts.connectionRules} rules`, ts: Date.now() - 1000 * 60 * 28 },
    ],
  };
}
