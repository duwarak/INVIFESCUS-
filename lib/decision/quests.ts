import { Quest, QuestCategory, QuestStep } from "./types";

function step(id: string, title: string, evidence: QuestStep["evidence"], estMin: number, optional = false): QuestStep {
  return { id, title, evidence, estMin, optional };
}

const dailyBase: Omit<Quest, "id">[] = [
  {
    title: "Capture & Decompose",
    narrative: "Ingest one note today and break it into its smallest moving parts.",
    category: "daily",
    difficulty: 2,
    energy: "low",
    windowMin: 30,
    steps: [
      step("s1", "Upload one note, image, or voice memo", "upload", 5),
      step("s2", "Tag 3 sub-concepts", "checkbox", 4),
      step("s3", "Write a 2-sentence summary for Future You", "reflection", 6),
    ],
    rewardTable: "dailyQuest",
    skillTrees: ["Cognitive Systems"],
    agents: ["Personal Knowledge Agent"],
  },
  {
    title: "Cross-Domain Bridge",
    narrative: "Bridge one concept from today into a domain you don't usually touch.",
    category: "transfer",
    difficulty: 3,
    energy: "medium",
    windowMin: 40,
    steps: [
      step("s1", "Pick one concept from the Power Brain", "checkbox", 3),
      step("s2", "Propose a connection in another domain", "reflection", 12),
      step("s3", "Have the Cross-Domain Synthesis Agent rate it", "external", 5),
    ],
    rewardTable: "dailyQuest",
    skillTrees: ["Learning Transfer", "Creative Synthesis"],
    agents: ["Cross-Domain Synthesis Agent"],
  },
  {
    title: "Socratic Reflection",
    narrative: "Coach Agent will ask 3 sharp questions about your last decision.",
    category: "reflection",
    difficulty: 2,
    energy: "low",
    windowMin: 15,
    steps: [
      step("s1", "Open Inspector on a recent decision", "checkbox", 2),
      step("s2", "Answer 3 Socratic prompts", "reflection", 8),
      step("s3", "Log one change you'll make", "reflection", 5),
    ],
    rewardTable: "dailyQuest",
    skillTrees: ["Decision Intelligence", "Emotional Regulation"],
    agents: ["Socratic Coach Agent"],
  },
];

const weeklyBase: Omit<Quest, "id">[] = [
  {
    title: "Build the Weekly Synthesis Map",
    narrative: "Compose one mind map that links every concept captured this week.",
    category: "weekly_synthesis",
    difficulty: 4,
    energy: "high",
    windowMin: 90,
    steps: [
      step("s1", "Open Memory Palace", "checkbox", 2),
      step("s2", "Pick top 12 concepts", "checkbox", 8),
      step("s3", "Push 4 multi-level synthesis nodes", "upload", 25),
      step("s4", "Generate infographic", "external", 6),
    ],
    rewardTable: "weeklySynthesis",
    skillTrees: ["Cognitive Systems", "Creative Synthesis", "Learning Transfer"],
    agents: ["Personal Knowledge Agent", "Cross-Domain Synthesis Agent"],
  },
  {
    title: "Defend Your Plan vs the Critic Agent",
    narrative: "Submit next week's plan. The Critic and Evaluation agents will steel-man and red-team it.",
    category: "agent_challenge",
    difficulty: 4,
    energy: "medium",
    windowMin: 45,
    steps: [
      step("s1", "Draft 3 goals for next week", "reflection", 10),
      step("s2", "Receive the Critic's 3 strongest objections", "external", 4),
      step("s3", "Rewrite goals; mark which objections you accept", "reflection", 18),
    ],
    rewardTable: "weeklySynthesis",
    skillTrees: ["Decision Intelligence", "Communication"],
    agents: ["Evaluation Agent", "Socratic Coach Agent"],
  },
];

const monthlyBase: Omit<Quest, "id">[] = [
  {
    title: "Boss Decision · Quarter-Defining Choice",
    narrative: "One decision will define the next 90 days. Run it through 5 agents and a pre-mortem.",
    category: "boss",
    difficulty: 5,
    energy: "high",
    windowMin: 180,
    steps: [
      step("s1", "Frame the decision in one sentence", "reflection", 5),
      step("s2", "Run multi-agent debate (5 personas)", "external", 25),
      step("s3", "Project 3 futures (tomorrow / next-week / next-quarter)", "external", 25),
      step("s4", "Mirror to the closest of the 50 unpredictable scenarios", "external", 10),
      step("s5", "Write a pre-mortem of the failure modes", "reflection", 30),
      step("s6", "Commit and set the leading indicator", "reflection", 10),
    ],
    rewardTable: "bossDecision",
    skillTrees: ["Decision Intelligence", "Cognitive Systems", "Emotional Regulation"],
    agents: ["Socratic Coach Agent", "Evaluation Agent", "Cross-Domain Synthesis Agent"],
  },
  {
    title: "Community Guild Mission",
    narrative: "Pick a pod near you, schedule a real meetup, and convert one connection into a learning loop.",
    category: "guild",
    difficulty: 3,
    energy: "medium",
    windowMin: 120,
    steps: [
      step("s1", "Open Community Atlas, pick a pod", "checkbox", 5),
      step("s2", "Request to join + propose topic", "external", 15),
      step("s3", "Attend / co-host an event", "external", 60, true),
      step("s4", "Log the connection + insight back into your Brain", "upload", 12),
    ],
    rewardTable: "weeklySynthesis",
    skillTrees: ["Social Capital", "Communication"],
    agents: ["Community Matchmaker Agent"],
  },
];

function instantiate(seed: number, cadence: "daily" | "weekly" | "monthly", count: number): Quest[] {
  const pool = cadence === "daily" ? dailyBase : cadence === "weekly" ? weeklyBase : monthlyBase;
  return Array.from({ length: count }, (_, i) => {
    const tpl = pool[(seed + i) % pool.length];
    return {
      ...tpl,
      id: `q-${cadence}-${seed}-${i}`,
    } as Quest;
  });
}

export function buildQuests(seed: number) {
  return {
    daily: instantiate(seed, "daily", 3),
    weekly: instantiate(seed, "weekly", 2),
    monthly: instantiate(seed, "monthly", 2),
  };
}

export function categoryColor(c: QuestCategory): string {
  return {
    main: "#5b8dff", daily: "#30d158", weekly_synthesis: "#ff66c4",
    reflection: "#ff9f0a", transfer: "#9b6dff", boss: "#ff453a",
    social: "#06b6a8", recovery: "#94a3b8", agent_challenge: "#0ea5e9",
    guild: "#f4a02e",
  }[c];
}
