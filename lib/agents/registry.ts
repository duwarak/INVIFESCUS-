export type AgentLayer =
  | "input" | "knowledge" | "decision" | "community" | "safety" | "memory" | "ui" | "bridge";

export interface AgentSpec {
  id: string;
  name: string;
  layer: AgentLayer;
  status: "running" | "idle" | "warning";
  description: string;
  lastAction: string;
  heartbeatMs: number;
  emoji: string;
  color: string;
  storesIn: string;
}

const now = Date.now();

export const AGENT_REGISTRY: AgentSpec[] = [
  { id: "personal_knowledge", name: "Personal Knowledge Agent", layer: "knowledge", status: "running", description: "Owns the live + memory graphs. Reads MemPalace, writes back synthesis nodes.", lastAction: "Indexed 90 nodes + 21 synthesis bridges", heartbeatMs: 1200, emoji: "🧠", color: "#5b8dff", storesIn: "MemPalace · wing:knowledge" },
  { id: "cross_domain", name: "Cross-Domain Synthesis Agent", layer: "knowledge", status: "running", description: "Surfaces bridges between domains via L4 traversal + corpus mirror.", lastAction: "Surfaced 200 corpus angles + 4 live bridges", heartbeatMs: 1800, emoji: "🔗", color: "#9b6dff", storesIn: "MemPalace · wing:bridges" },
  { id: "research", name: "Research Synthesis Agent", layer: "input", status: "running", description: "Live OpenAlex + Wikipedia + arXiv fetch with 10-min cache.", lastAction: "Cached 12 hits across 3 sources", heartbeatMs: 800, emoji: "🔬", color: "#0ea5e9", storesIn: "MemPalace · wing:research" },
  { id: "socratic_coach", name: "Socratic Coach Agent", layer: "decision", status: "running", description: "Generates reflection prompts; mirrors Munger / Bezos / Dalio frames.", lastAction: "Ran 3 Socratic prompts for last decision", heartbeatMs: 1500, emoji: "🎯", color: "#f4a02e", storesIn: "MemPalace · wing:reflections" },
  { id: "evaluation", name: "Evaluation Agent", layer: "decision", status: "running", description: "Red-team. Steelmans counter-arguments; runs pre-mortem.", lastAction: "Red-teamed 5 decisions this week", heartbeatMs: 2000, emoji: "⚖️", color: "#ef476f", storesIn: "MemPalace · wing:decisions/critique" },
  { id: "community_match", name: "Community Matchmaker Agent", layer: "community", status: "running", description: "Pod matching by knowledge-graph overlap; respects safety policy.", lastAction: "Refreshed 20 pods, 6 connection suggestions", heartbeatMs: 3000, emoji: "🌐", color: "#22c55e", storesIn: "MemPalace · wing:community" },
  { id: "cross_linker", name: "Cross-Linker Agent", layer: "knowledge", status: "running", description: "Suggests missing wikilinks across the vault.", lastAction: "Suggested 8 missing back-links", heartbeatMs: 5000, emoji: "🪡", color: "#ec4899", storesIn: "MemPalace · wing:vault/audit" },
  { id: "orphan_rescue", name: "Orphan-Rescue Agent", layer: "knowledge", status: "running", description: "Finds zero-edge nodes and proposes neighbors.", lastAction: "Detected 2 orphans + 12 lonely nodes", heartbeatMs: 4000, emoji: "🌱", color: "#14b8a6", storesIn: "MemPalace · wing:vault/audit" },
  { id: "convergence", name: "Convergence Agent", layer: "knowledge", status: "running", description: "Ranks hubs that bridge 2+ clusters.", lastAction: "Surfaced top hub: Decomposition (score 135.8)", heartbeatMs: 6000, emoji: "✶", color: "#a855f7", storesIn: "MemPalace · wing:vault/audit" },
  { id: "moderation", name: "Moderation Agent (modcandy)", layer: "safety", status: "running", description: "Real-time toxicity scoring + automated flagging on posts + DMs.", lastAction: "Screened 30 posts; flagged 1; shadow-limited 1", heartbeatMs: 600, emoji: "🛡", color: "#ef476f", storesIn: "MemPalace · wing:safety/log" },
  { id: "safety_age", name: "Age-Safety Agent", layer: "safety", status: "running", description: "Applies under-16 policy: private-by-default, no DM, human-review only.", lastAction: "Applied guardian_only visibility to 4 profiles", heartbeatMs: 5000, emoji: "🧒", color: "#ff9f0a", storesIn: "MemPalace · wing:safety/policy" },
  { id: "discord_bridge", name: "Discord Bridge Agent", layer: "bridge", status: "idle", description: "OAuth + announcement bridge to Polymath pod servers. Disabled for under-16.", lastAction: "Idle — waiting for /community → Discord connect", heartbeatMs: 30000, emoji: "🟣", color: "#5865F2", storesIn: "(external · Discord API)" },
  { id: "user_agent", name: "User Agent (your shadow)", layer: "ui", status: "running", description: "A model of you. Predicts which questions you'll ask; offers proactive nudges.", lastAction: "Predicted 3 questions for your next Decision Lab run", heartbeatMs: 4000, emoji: "👤", color: "#5b8dff", storesIn: "MemPalace · wing:self" },
  { id: "tiny_llm", name: "Tiny LLM Engine", layer: "decision", status: "running", description: "Karpathy-style minimal forward pass (embed → attention → softmax → sample). Demonstrates the math under the agents.", lastAction: "Sampled 5 tokens · loss 2.41 · entropy 3.10", heartbeatMs: 200, emoji: "✦", color: "#5b8dff", storesIn: "in-memory · per-run" },
  { id: "mempalace_writer", name: "MemPalace Writer", layer: "memory", status: "running", description: "Persists every agent output to the file-backed memory store.", lastAction: "Wrote 4 synthesis levels · 21 edges", heartbeatMs: 1000, emoji: "💾", color: "#94a3b8", storesIn: ".brain-cache/memory-extensions.json" },
];

export function snapshotAgents() {
  return AGENT_REGISTRY.map((a) => ({
    ...a,
    sinceHeartbeatMs: Math.round(Math.random() * a.heartbeatMs),
    bootedAtISO: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
  }));
}

export function agentsByLayer() {
  const grouped = new Map<AgentLayer, AgentSpec[]>();
  for (const a of AGENT_REGISTRY) {
    if (!grouped.has(a.layer)) grouped.set(a.layer, []);
    grouped.get(a.layer)!.push(a);
  }
  return Array.from(grouped.entries()).map(([layer, agents]) => ({ layer, agents }));
}
