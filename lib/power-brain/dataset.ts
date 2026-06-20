import kg from "./dataset/02_knowledge_graph.json";
import mm from "./dataset/03_mental_models_database.json";
import ag from "./dataset/07_ai_agent_system.json";
import jr from "./dataset/08_complete_user_journey.json";
import {
  BrainEdge,
  BrainEdgeType,
  BrainGraph,
  BrainNode,
  BrainNodeType,
} from "./types";

interface RawNode {
  id: string;
  label: string;
  domain: string;
  type: string;
  description: string;
  difficulty?: string;
}
interface RawEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
  description: string;
}
interface RawMentalModel {
  id: string;
  name: string;
  description: string;
  example: string;
  power_rating: number;
}
interface RawAgent {
  id: string;
  name: string;
  icon: string;
  description: string;
  capabilities: string[];
  triggers: string[];
}
interface RawFlowStep {
  step: number;
  agent: string;
  action: string;
}
interface RawFlow {
  flow_name: string;
  description: string;
  steps: RawFlowStep[];
}

const TYPE_MAP: Record<string, BrainNodeType> = {
  core_concept: "concept",
  concept: "concept",
  framework: "method",
  skill: "method",
  tool: "method",
  technique: "method",
  method: "method",
  principle: "concept",
  state: "event",
  mental_model: "concept",
};

const REL_MAP: Record<string, BrainEdgeType> = {
  applies_to: "derived",
  enables: "derived",
  uses: "depends",
  requires: "depends",
  manifests_as: "derived",
  creates: "derived",
  modeled_by: "similar",
  similar_to: "similar",
  reduces: "contradicts",
  prevents: "contradicts",
  informs: "similar",
  enhances: "similar",
  guides: "similar",
  extends: "derived",
  bridge: "bridge",
};

const seenTypes = new Set<string>();

function toBrainNode(raw: RawNode, summary?: string): BrainNode {
  const type = TYPE_MAP[raw.type] ?? "concept";
  if (!seenTypes.has(raw.type)) seenTypes.add(raw.type);
  return {
    id: raw.id,
    label: raw.label,
    group: raw.domain,
    type,
    importance: raw.difficulty === "advanced" ? 0.9 : raw.difficulty === "intermediate" ? 0.65 : 0.45,
    score: 0.6,
    ts: Date.now(),
    summary: summary ?? raw.description,
  };
}

function toBrainEdge(raw: RawEdge): BrainEdge {
  return {
    source: raw.source,
    target: raw.target,
    type: REL_MAP[raw.relationship] ?? "similar",
    weight: raw.strength,
  };
}

let cachedGraph: BrainGraph | null = null;

export function loadFullGraph(): BrainGraph {
  if (cachedGraph) return cachedGraph;

  const baseNodes: BrainNode[] = (kg.nodes as RawNode[]).map((n) => toBrainNode(n));
  const baseEdges: BrainEdge[] = (kg.edges as RawEdge[]).map(toBrainEdge);

  const mmNodes: BrainNode[] = [];
  const mmEdges: BrainEdge[] = [];
  const categories = (mm.categories as { name: string; models: RawMentalModel[] }[]) ?? [];

  let mmIdx = 0;
  for (const cat of categories) {
    for (const m of cat.models) {
      mmIdx++;
      mmNodes.push({
        id: m.id,
        label: m.name,
        group: "Mental_Models",
        type: "concept",
        importance: Math.min(1, m.power_rating / 10),
        score: Math.min(1, m.power_rating / 10),
        ts: Date.now(),
        summary: `${m.description} — e.g. ${m.example}`,
      });
    }
  }

  const labelToId = new Map<string, string>();
  for (const n of [...baseNodes, ...mmNodes]) {
    labelToId.set(n.label.toLowerCase(), n.id);
  }

  const linkIfMatch = (mmId: string, label: string, weight: number) => {
    const tgt = labelToId.get(label.toLowerCase());
    if (tgt) mmEdges.push({ source: mmId, target: tgt, type: "similar", weight });
  };

  for (const cat of categories) {
    for (const m of cat.models) {
      const txt = `${m.name} ${m.description} ${m.example}`.toLowerCase();
      for (const other of baseNodes) {
        if (txt.includes(other.label.toLowerCase())) {
          linkIfMatch(m.id, other.label, 0.55 + Math.random() * 0.2);
        }
      }
    }
  }

  cachedGraph = {
    nodes: [...baseNodes, ...mmNodes],
    edges: [...baseEdges, ...mmEdges],
  };
  return cachedGraph;
}

export function loadLiveSlice(): BrainGraph {
  const full = loadFullGraph();
  const baseDomains = new Set(["Technology", "Communication", "Business", "Music", "Psychology", "Sports"]);
  const nodes = full.nodes.filter((n) => baseDomains.has(n.group));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = full.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  return { nodes, edges };
}

export function loadMemorySlice(): BrainGraph {
  return loadFullGraph();
}

export function loadGenealogySlice(): BrainGraph {
  const full = loadFullGraph();
  const topModels = full.nodes.filter((n) => n.group === "Mental_Models" && n.importance >= 0.7);
  const ids = new Set([...full.nodes.filter((n) => n.group !== "Mental_Models").map((n) => n.id), ...topModels.map((n) => n.id)]);
  const edges = full.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  return { nodes: [...full.nodes.filter((n) => ids.has(n.id))], edges };
}

export interface AgentSpec {
  id: string;
  name: string;
  icon: string;
  description: string;
  capabilities: string[];
  triggers: string[];
  color: string;
}

const AGENT_COLORS: Record<string, string> = {
  agent_personal: "#5b6cff",
  agent_research: "#0ea5e9",
  agent_synthesis: "#9b6dff",
  agent_coach: "#f4a02e",
  agent_evaluation: "#ef476f",
  agent_community: "#22c55e",
};

export function loadAgents(): AgentSpec[] {
  const roles = (ag.agent_roles as RawAgent[]) ?? [];
  return roles.map((a) => ({
    id: a.id,
    name: a.name,
    icon: a.icon,
    description: a.description,
    capabilities: a.capabilities,
    triggers: a.triggers,
    color: AGENT_COLORS[a.id] ?? "#5b6cff",
  }));
}

export function loadFlows(): RawFlow[] {
  return (ag.agent_collaboration_flows as RawFlow[]) ?? [];
}

export function pickFlowForRelation(rel: BrainEdgeType): RawFlow | null {
  const flows = loadFlows();
  if (rel === "bridge" || rel === "similar") return flows.find((f) => f.flow_name === "New Knowledge Capture") ?? null;
  if (rel === "derived" || rel === "depends") return flows.find((f) => f.flow_name === "Daily Morning Routine") ?? null;
  return flows[0] ?? null;
}

export function loadJourneyHints(): string[] {
  type Ev = { type?: string; ai_processing?: string };
  const events = (jr.events as Ev[] | undefined) ?? [];
  return events.map((e) => e.ai_processing ?? e.type ?? "").filter(Boolean).slice(0, 5);
}
