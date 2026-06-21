import { BrainGraph, BrainNode } from "./types";
import { InsightLevels } from "./insights";

export interface Persona {
  id: string;
  speakingAs: string;
  faction: string;
  stance: string;
  bias: string;
  knowledgeScope: string[];
  memoryWindow: string;
  speakingStyle: string;
  confidence: number;
  factions: string[];
}

const FACTION_BY_DOMAIN: Record<string, string> = {
  Technology: "the Architects",
  Communication: "the Bridgemakers",
  Business: "the Allocators",
  Music: "the Composers",
  Psychology: "the Interpreters",
  Sports: "the Practitioners",
  Mental_Models: "the Latticeworkers",
};

const STANCE_BY_TYPE: Record<string, string> = {
  concept: "abstraction-first — speaks from the principle, then the example",
  method: "technique-first — speaks from the procedure, then justifies it",
  framework: "lattice-first — speaks from the model, applies across domains",
  decision: "trade-off-first — speaks from the choice and what it sacrifices",
  event: "moment-first — speaks from when and why it happened",
  person: "voice-first — speaks in their documented register",
};

const BIAS_BY_DOMAIN: Record<string, string> = {
  Technology: "favors abstraction, modularity, and composition; suspicious of magic",
  Communication: "favors empathy, audience model, and tone; suspicious of jargon",
  Business: "favors incentives, second-order effects, and compounding; suspicious of free lunches",
  Music: "favors pattern, repetition, and resonance; suspicious of novelty without form",
  Psychology: "favors System 2, calibration, and bias correction; suspicious of confidence",
  Sports: "favors progressive overload and embodiment; suspicious of disembodied theory",
  Mental_Models: "favors inversion and circle of competence; suspicious of single-frame analysis",
};

const STYLE_BY_DIFFICULTY: Record<string, string> = {
  beginner: "short, concrete sentences; one example per claim",
  intermediate: "structured paragraphs with one analogy",
  advanced: "compressed, references prior frameworks, expects pushback",
};

function difficultyFromImportance(importance: number): string {
  if (importance >= 0.8) return "advanced";
  if (importance >= 0.55) return "intermediate";
  return "beginner";
}

export function buildPersona(
  node: BrainNode,
  graph: BrainGraph,
  insights: InsightLevels | null
): Persona {
  const faction = FACTION_BY_DOMAIN[node.group] ?? "the Generalists";
  const stance = STANCE_BY_TYPE[node.type] ?? "balanced — speaks from analogy then evidence";
  const bias = BIAS_BY_DOMAIN[node.group] ?? "favors first principles";
  const difficulty = difficultyFromImportance(node.importance);
  const style = STYLE_BY_DIFFICULTY[difficulty];

  const scopeIds = new Set<string>();
  if (insights) {
    for (const d of insights.L1_direct.slice(0, 4)) scopeIds.add(d.node.id);
    for (const d of insights.L2_twoHop.slice(0, 4)) scopeIds.add(d.node.id);
    for (const d of insights.L3_cluster.slice(0, 4)) scopeIds.add(d.node.id);
  }
  const knowledgeScope = Array.from(scopeIds)
    .map((id) => graph.nodes.find((n) => n.id === id)?.label)
    .filter(Boolean) as string[];

  const factions = Array.from(
    new Set(
      [
        faction,
        ...(insights?.L4_crossDomain ?? []).map(
          (d) => FACTION_BY_DOMAIN[d.node.group] ?? "the Generalists"
        ),
      ].slice(0, 4)
    )
  );

  const memoryWindow = insights
    ? `${insights.L1_direct.length + insights.L2_twoHop.length} indexed concepts, ${insights.signals.depth}-hop horizon`
    : "single-node horizon";

  return {
    id: `persona-${node.id}`,
    speakingAs: node.label,
    faction,
    stance,
    bias,
    knowledgeScope,
    memoryWindow,
    speakingStyle: style,
    confidence: Number((0.4 + node.importance * 0.5).toFixed(2)),
    factions,
  };
}

export interface DebateTurn {
  role: "moderator" | "proponent" | "critic" | "synthesizer";
  speaker: string;
  text: string;
}

export function simulateDebate(
  node: BrainNode,
  graph: BrainGraph,
  insights: InsightLevels | null
): DebateTurn[] {
  const persona = buildPersona(node, graph, insights);
  const top = insights?.L1_direct[0]?.node ?? null;
  const cross = insights?.L4_crossDomain[0]?.node ?? null;
  const peer = insights?.L3_cluster[0]?.node ?? null;

  const turns: DebateTurn[] = [];
  turns.push({
    role: "moderator",
    speaker: "Coach (Socratic)",
    text: `Today's claim: "${node.label}" is the load-bearing ${node.type} in ${node.group}. Proponent opens.`,
  });
  turns.push({
    role: "proponent",
    speaker: `${node.label} (${persona.faction})`,
    text: `${node.summary ?? node.label}. ${top ? `It directly shapes ${top.label} (${top.group}) — that's where its leverage shows.` : "Its leverage is structural, not anecdotal."} ${persona.bias}.`,
  });
  if (cross) {
    turns.push({
      role: "critic",
      speaker: `${cross.label} (${FACTION_BY_DOMAIN[cross.group] ?? "the Generalists"})`,
      text: `Counterpoint from ${cross.group}: the same pattern shows up here, but you owe an account of why your domain solves it better. Cross-domain bridge weight is ${(insights!.L4_crossDomain[0].weight * 100).toFixed(0)}%, not 100%.`,
    });
  }
  if (peer) {
    turns.push({
      role: "critic",
      speaker: `${peer.label} (same domain)`,
      text: `Same domain, adjacent stance: where you stop at ${node.label}, I stop at ${peer.label}. We share ${peer.label} as a peer — explain when one beats the other.`,
    });
  }
  turns.push({
    role: "synthesizer",
    speaker: "Evaluation Agent",
    text: `Synthesis: depth ${insights?.signals.depth ?? 0}, bridge ratio ${(((insights?.signals.bridgeRatio ?? 0) * 100) | 0)}%, novelty ${(((insights?.signals.novelty ?? 0) * 100) | 0)}%. Recommendation: ${insights && insights.signals.bridgeRatio > 0.5 ? "promote to a cross-domain anchor in Memory Palace." : "deepen within-domain mastery before bridging further."}`,
  });
  return turns;
}
