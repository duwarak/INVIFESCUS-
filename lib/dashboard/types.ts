export interface MindMapNode {
  id: string;
  label: string;
  color?: string;
  children?: MindMapNode[];
}

export interface ForceNode {
  id: string;
  label: string;
  group: string;
  color: string;
  val: number;
}
export interface ForceLink {
  source: string;
  target: string;
  weight: number;
}

export interface TimeSeriesRow {
  date: string;
  items: { name: string; value: number; color: string }[];
}

export interface SpatialPoint {
  id: string;
  label: string;
  lng: number;
  lat: number;
  weight: number;
  color: string;
}

export interface SourceCounter {
  name: string;
  repo: string;
  stars?: number;
  category: "graph" | "map" | "timeseries" | "mindmap" | "core";
  role: string;
}

export interface DashboardData {
  totals: {
    concepts: number;
    domains: number;
    bridges: number;
    reflections: number;
    feedItems: number;
    openSourceRepos: number;
    activeAgents: number;
  };
  mindMap: MindMapNode;
  force: { nodes: ForceNode[]; links: ForceLink[] };
  timeSeries: TimeSeriesRow[];
  spatial: SpatialPoint[];
  sources: SourceCounter[];
  agentTrail: { agent: string; action: string; ts: number }[];
}
