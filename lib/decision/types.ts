export type QuestCategory =
  | "main" | "daily" | "weekly_synthesis" | "reflection"
  | "transfer" | "boss" | "social" | "recovery"
  | "agent_challenge" | "guild";

export type QuestEnergy = "low" | "medium" | "high";

export interface QuestStep {
  id: string;
  title: string;
  evidence: "upload" | "checkbox" | "voice" | "reflection" | "external";
  optional?: boolean;
  estMin: number;
}

export interface Quest {
  id: string;
  title: string;
  narrative: string;
  category: QuestCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  energy: QuestEnergy;
  windowMin: number;
  steps: QuestStep[];
  rewardTable: string;
  skillTrees: string[];
  agents: string[];
}

export interface LootItem {
  item: string;
  itemChance: { low: number; high: number };
  minAmount: number;
  maxAmount: number;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  emoji?: string;
}
export interface LootTier {
  tableChance: { low: number; high: number };
  items: LootItem[];
  guaranteed?: { item: string; minAmount: number; maxAmount: number; emoji?: string }[];
}
export interface LootTable {
  primary?: LootTier;
  secondary?: LootTier;
  tertiary?: LootTier;
  legendary?: LootTier;
}
export interface LootDrop {
  item: string;
  amount: number;
  tier: string;
  rarity: string;
  emoji: string;
  guaranteed: boolean;
}

export interface DecisionAnalysis {
  question: string;
  agentVotes: {
    agent: string;
    stance: "support" | "oppose" | "reframe";
    confidence: number;
    rationale: string;
    color: string;
  }[];
  futures: {
    horizon: "tomorrow" | "next-week" | "next-quarter";
    label: string;
    likelihood: number;
    upside: string;
    downside: string;
    leadingIndicator: string;
  }[];
  scenarioMirror: {
    id: string;
    title: string;
    why: string;
    detectedPattern: string;
    solutions: { angle: string; solution: string; domains: string[] }[];
  };
  recommendation: string;
}

export interface PlanCadence {
  cadence: "daily" | "weekly" | "monthly";
  themeOfTheDay?: string;
  themeOfTheWeek?: string;
  themeOfTheMonth?: string;
  quests: Quest[];
  goals: string[];
  reflectionPrompts: string[];
  totalXPCeiling: number;
}

export interface DecisionRunResponse {
  question: string;
  analysis: DecisionAnalysis;
  daily: PlanCadence;
  weekly: PlanCadence;
  monthly: PlanCadence;
  loot: LootDrop[];
  llmTrace: { stage: string; output: string; tokensUsed: number; ms: number }[];
  trainingHits: { kind: string; ref: string }[];
}
