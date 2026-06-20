export type BrainNodeType =
  | "concept"
  | "person"
  | "decision"
  | "event"
  | "method";

export type BrainEdgeType =
  | "bridge"
  | "derived"
  | "similar"
  | "depends"
  | "contradicts";

export interface BrainNode {
  id: string;
  label: string;
  type: BrainNodeType;
  group: string;
  score: number;
  importance: number;
  ringHint?: number;
  icon?: string;
  ts: number;
  summary?: string;
}

export interface BrainEdge {
  source: string;
  target: string;
  type: BrainEdgeType;
  weight: number;
}

export interface BrainGraph {
  nodes: BrainNode[];
  edges: BrainEdge[];
}

export type BrainView = "live" | "memory" | "genealogy";

export interface RadialOpts {
  cx: number;
  cy: number;
  baseR: number;
  ringGap: number;
  maxRing: number;
  centerCount: number;
  nodeDiameter: number;
  nodePadding: number;
}

export const DEFAULT_RADIAL_OPTS: RadialOpts = {
  cx: 0,
  cy: 0,
  baseR: 180,
  ringGap: 140,
  maxRing: 5,
  centerCount: 8,
  nodeDiameter: 44,
  nodePadding: 14,
};

export interface ExplainResponse {
  node: BrainNode;
  neighbors: { node: BrainNode; relation: BrainEdgeType; weight: number }[];
  narrative: string;
  sources: { kind: "mempalace" | "mirofish" | "rag" | "chatbot"; ref: string }[];
}
