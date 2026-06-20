// Ring 2 — CausalGraphEngine
// Hardcoded weighted graph of life variables
// NOT learned — fixed weights, deterministic propagation
// Used by ScenarioAgent to produce the "Decision Weather Report"

export interface CausalNode {
  id: string;
  label: string;
  currentValue: number; // 0-100 scale
  description: string;
}

export interface CausalEdge {
  from: string;
  to: string;
  weight: number; // -1.0 to +1.0 (negative = inverse relationship)
  label: string;
}

export interface PropagationResult {
  nodeId: string;
  label: string;
  originalValue: number;
  newValue: number;
  delta: number;
  explanation: string;
}

// Default life-variable nodes for the demo user (overwhelmed undergraduate)
export const DEFAULT_NODES: CausalNode[] = [
  { id: "gym",          label: "Physical exercise",  currentValue: 65, description: "Weekly gym sessions and activity level" },
  { id: "energy",       label: "Energy level",       currentValue: 55, description: "Daily energy and alertness" },
  { id: "sleep",        label: "Sleep quality",      currentValue: 50, description: "Hours and restfulness of sleep" },
  { id: "stress",       label: "Stress level",       currentValue: 70, description: "Overall psychological pressure" },
  { id: "project_time", label: "Project progress",   currentValue: 40, description: "Time spent on tech project" },
  { id: "skill_decay",  label: "Skill maintenance",  currentValue: 60, description: "Retention of music/gymnastics skills" },
  { id: "social",       label: "Social connection",   currentValue: 35, description: "Meaningful interactions with peers" },
  { id: "academics",    label: "Academic performance",currentValue: 55, description: "Coursework quality and deadlines" },
];

// Causal edges — the relationships between variables
export const DEFAULT_EDGES: CausalEdge[] = [
  { from: "gym",          to: "energy",       weight: 0.6,  label: "exercise boosts energy" },
  { from: "gym",          to: "sleep",        weight: 0.4,  label: "exercise improves sleep" },
  { from: "gym",          to: "stress",       weight: -0.5, label: "exercise reduces stress" },
  { from: "gym",          to: "project_time", weight: -0.2, label: "gym time competes with project time" },
  { from: "sleep",        to: "energy",       weight: 0.7,  label: "good sleep restores energy" },
  { from: "sleep",        to: "academics",    weight: 0.3,  label: "sleep improves focus for study" },
  { from: "energy",       to: "academics",    weight: 0.5,  label: "more energy enables better study" },
  { from: "energy",       to: "project_time", weight: 0.4,  label: "energy enables productive project work" },
  { from: "energy",       to: "social",       weight: 0.3,  label: "energy makes socializing possible" },
  { from: "stress",       to: "sleep",        weight: -0.6, label: "high stress disrupts sleep" },
  { from: "stress",       to: "energy",       weight: -0.4, label: "stress drains energy" },
  { from: "stress",       to: "social",       weight: -0.3, label: "stress causes withdrawal" },
  { from: "project_time", to: "stress",       weight: -0.3, label: "project progress reduces stress" },
  { from: "project_time", to: "skill_decay",  weight: -0.2, label: "project focus competes with practice" },
  { from: "social",       to: "stress",       weight: -0.4, label: "social support reduces stress" },
  { from: "skill_decay",  to: "stress",       weight: 0.2,  label: "losing skills creates anxiety" },
];

// Propagate a change through the graph
// action: which node changes, delta: how much it changes (-100 to +100)
// depth: how many hops to propagate (1 = direct effects, 2 = second-order)
export function propagate(
  action: string,
  delta: number,
  depth: number = 2,
  nodes: CausalNode[] = DEFAULT_NODES,
  edges: CausalEdge[] = DEFAULT_EDGES
): PropagationResult[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, { ...n }]));
  const results: PropagationResult[] = [];
  const visited = new Set<string>();

  function propagateFrom(nodeId: string, currentDelta: number, currentDepth: number) {
    if (currentDepth > depth || visited.has(`${nodeId}-${currentDepth}`)) return;
    visited.add(`${nodeId}-${currentDepth}`);

    const outgoing = edges.filter((e) => e.from === nodeId);
    for (const edge of outgoing) {
      const target = nodeMap.get(edge.to);
      if (!target) continue;

      const effectiveDelta = currentDelta * edge.weight;
      const originalValue = target.currentValue;
      target.currentValue = Math.max(0, Math.min(100, target.currentValue + effectiveDelta));

      const existing = results.find((r) => r.nodeId === edge.to);
      if (existing) {
        existing.newValue = target.currentValue;
        existing.delta += effectiveDelta;
        existing.explanation += ` + ${edge.label}`;
      } else {
        results.push({
          nodeId: edge.to,
          label: target.label,
          originalValue,
          newValue: target.currentValue,
          delta: effectiveDelta,
          explanation: edge.label,
        });
      }

      propagateFrom(edge.to, effectiveDelta, currentDepth + 1);
    }
  }

  propagateFrom(action, delta, 1);

  return results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

// Generate a narrative summary of propagation results
export function narrativeSummary(action: string, delta: number, results: PropagationResult[]): string {
  const direction = delta > 0 ? "increase" : "decrease";
  const actionNode = DEFAULT_NODES.find((n) => n.id === action);
  const actionLabel = actionNode?.label || action;

  const significant = results.filter((r) => Math.abs(r.delta) >= 3);
  if (significant.length === 0) return `A ${direction} in ${actionLabel} has minimal downstream effects.`;

  const effects = significant.map((r) => {
    const dir = r.delta > 0 ? "improves" : "declines";
    return `${r.label} ${dir} by ${Math.abs(r.delta).toFixed(0)} points (${r.explanation})`;
  });

  return `If ${actionLabel} ${direction}s by ${Math.abs(delta)} points: ${effects.join("; ")}.`;
}
