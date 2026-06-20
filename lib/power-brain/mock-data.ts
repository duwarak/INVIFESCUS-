import { BrainEdge, BrainGraph, BrainNode, BrainNodeType } from "./types";

const GROUPS = [
  "computer-science",
  "music",
  "business",
  "gymnastics",
  "psychology",
  "mathematics",
  "design",
  "biology",
];

const TYPES: BrainNodeType[] = [
  "concept",
  "method",
  "event",
  "decision",
  "person",
];

const GROUP_SEEDS: Record<string, string[]> = {
  "computer-science": [
    "Decomposition",
    "Recursion",
    "Type systems",
    "Concurrency",
    "Distributed locks",
    "Garbage collection",
    "Indexing",
    "Compilers",
  ],
  music: [
    "Repetition mastery",
    "Counterpoint",
    "Harmonic series",
    "Rhythmic displacement",
    "Modal interchange",
    "Voice leading",
    "Form analysis",
  ],
  business: [
    "Audience adjustment",
    "Pricing power",
    "Funnel design",
    "Retention loops",
    "Compounding",
    "Unit economics",
    "Cohort analysis",
  ],
  gymnastics: [
    "Form breakdown",
    "Progressive overload",
    "Strength endurance",
    "Tumbling lines",
    "Apparatus transitions",
  ],
  psychology: [
    "Systems thinking",
    "Cognitive load",
    "Flow states",
    "Operant conditioning",
    "Metacognition",
    "Attention residue",
  ],
  mathematics: [
    "Group theory",
    "Linear algebra",
    "Topology",
    "Probability",
    "Information theory",
  ],
  design: [
    "Gestalt grouping",
    "Information scent",
    "Affordances",
    "Negative space",
  ],
  biology: ["Homeostasis", "Phenotype plasticity", "Neuroplasticity"],
};

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function makeNode(
  id: string,
  label: string,
  group: string,
  type: BrainNodeType,
  importance: number,
  score: number,
  ts: number
): BrainNode {
  return { id, label, group, type, importance, score, ts };
}

export function buildLiveMock(): BrainGraph {
  const rng = rand(42);
  const nodes: BrainNode[] = [];
  const edges: BrainEdge[] = [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const centers: { label: string; group: string }[] = [
    { label: "Today's focus", group: "psychology" },
    { label: "Polymath Engine", group: "computer-science" },
    { label: "Mastery practice", group: "music" },
    { label: "Hackathon demo", group: "business" },
    { label: "Form drill", group: "gymnastics" },
    { label: "Systems lens", group: "psychology" },
  ];
  centers.forEach((c, i) => {
    nodes.push(
      makeNode(
        `c-${i}`,
        c.label,
        c.group,
        "concept",
        0.9 + rng() * 0.1,
        0.8 + rng() * 0.2,
        now - rng() * 6 * 60 * 60 * 1000
      )
    );
  });

  let nid = 0;
  for (let r = 1; r <= 3; r++) {
    const countByGroup = r === 1 ? 5 : r === 2 ? 8 : 12;
    for (const g of GROUPS) {
      const seeds = GROUP_SEEDS[g] ?? ["Idea"];
      for (let i = 0; i < countByGroup; i++) {
        const label = `${seeds[i % seeds.length]}${i >= seeds.length ? ` ${Math.floor(i / seeds.length) + 1}` : ""}`;
        const t = TYPES[Math.floor(rng() * TYPES.length)];
        const id = `n-${nid++}`;
        nodes.push(
          makeNode(
            id,
            label,
            g,
            t,
            0.4 + rng() * 0.5,
            0.3 + rng() * 0.6,
            now - rng() * day
          )
        );

        let parentId: string;
        if (r === 1) {
          const closest = centers.findIndex((c) => c.group === g);
          parentId = `c-${closest >= 0 ? closest : Math.floor(rng() * centers.length)}`;
        } else {
          const innerCount = nodes.length - centers.length - 1;
          const innerIdx = Math.floor(rng() * Math.max(innerCount, 1));
          parentId = `n-${innerIdx}`;
        }
        edges.push({
          source: parentId,
          target: id,
          type: "derived",
          weight: 0.4 + rng() * 0.6,
        });
      }
    }
  }

  for (let i = 0; i < 20; i++) {
    const a = nodes[Math.floor(rng() * nodes.length)];
    const b = nodes[Math.floor(rng() * nodes.length)];
    if (a.id === b.id || a.group === b.group) continue;
    edges.push({
      source: a.id,
      target: b.id,
      type: "bridge",
      weight: 0.5 + rng() * 0.5,
    });
  }

  return { nodes, edges };
}

export function buildMemoryMock(): BrainGraph {
  const rng = rand(7);
  const nodes: BrainNode[] = [];
  const edges: BrainEdge[] = [];
  const now = Date.now();
  const year = 365 * 24 * 60 * 60 * 1000;

  const centers: { label: string; group: string }[] = [
    { label: "Self", group: "psychology" },
    { label: "Computing", group: "computer-science" },
    { label: "Music", group: "music" },
    { label: "Business", group: "business" },
    { label: "Body", group: "gymnastics" },
    { label: "Mind", group: "psychology" },
    { label: "Math", group: "mathematics" },
    { label: "Design", group: "design" },
  ];
  centers.forEach((c, i) => {
    nodes.push(
      makeNode(
        `mc-${i}`,
        c.label,
        c.group,
        "concept",
        1,
        0.95 + rng() * 0.05,
        now - rng() * year
      )
    );
  });

  let nid = 0;
  const perGroupPerRing = [0, 14, 22, 36, 48];
  for (let r = 1; r <= 4; r++) {
    const target = perGroupPerRing[r];
    for (const g of GROUPS) {
      const seeds = GROUP_SEEDS[g] ?? ["Concept"];
      for (let i = 0; i < target; i++) {
        const baseLabel = seeds[i % seeds.length];
        const label = `${baseLabel}${i >= seeds.length ? ` #${Math.floor(i / seeds.length)}` : ""}`;
        const t = TYPES[Math.floor(rng() * TYPES.length)];
        const id = `m-${nid++}`;
        nodes.push(
          makeNode(
            id,
            label,
            g,
            t,
            0.2 + rng() * 0.6,
            0.2 + rng() * 0.7,
            now - rng() * year
          )
        );

        let parentId: string;
        if (r === 1) {
          const idx = centers.findIndex((c) => c.group === g);
          parentId = `mc-${idx >= 0 ? idx : Math.floor(rng() * centers.length)}`;
        } else {
          const sameRingPrev = nodes
            .filter(
              (n) => n.group === g && n.id !== id && n.id.startsWith("m-")
            )
            .slice(-Math.max(target * 2, 5));
          if (sameRingPrev.length && rng() > 0.3) {
            parentId =
              sameRingPrev[Math.floor(rng() * sameRingPrev.length)].id;
          } else {
            const idx = centers.findIndex((c) => c.group === g);
            parentId = `mc-${idx >= 0 ? idx : Math.floor(rng() * centers.length)}`;
          }
        }
        edges.push({
          source: parentId,
          target: id,
          type: rng() > 0.5 ? "derived" : "similar",
          weight: 0.3 + rng() * 0.7,
        });
      }
    }
  }

  for (let i = 0; i < 120; i++) {
    const a = nodes[Math.floor(rng() * nodes.length)];
    const b = nodes[Math.floor(rng() * nodes.length)];
    if (a.id === b.id || a.group === b.group) continue;
    edges.push({
      source: a.id,
      target: b.id,
      type: "bridge",
      weight: 0.4 + rng() * 0.6,
    });
  }

  return { nodes, edges };
}

export function buildGenealogyMock(): BrainGraph {
  const rng = rand(99);
  const nodes: BrainNode[] = [];
  const edges: BrainEdge[] = [];
  const now = Date.now();

  const lineage: { id: string; label: string; group: string; parents: string[] }[] = [
    { id: "g-0", label: "Mathematics", group: "mathematics", parents: [] },
    { id: "g-1", label: "Logic", group: "mathematics", parents: ["g-0"] },
    { id: "g-2", label: "Information theory", group: "mathematics", parents: ["g-1"] },
    { id: "g-3", label: "Computability", group: "computer-science", parents: ["g-1"] },
    { id: "g-4", label: "Algorithms", group: "computer-science", parents: ["g-3"] },
    { id: "g-5", label: "Compilers", group: "computer-science", parents: ["g-4"] },
    { id: "g-6", label: "Type systems", group: "computer-science", parents: ["g-3", "g-5"] },
    { id: "g-7", label: "Symbolic AI", group: "computer-science", parents: ["g-3"] },
    { id: "g-8", label: "Statistics", group: "mathematics", parents: ["g-0"] },
    { id: "g-9", label: "Probability", group: "mathematics", parents: ["g-8"] },
    { id: "g-10", label: "Bayesian inference", group: "mathematics", parents: ["g-9"] },
    { id: "g-11", label: "Neural nets", group: "computer-science", parents: ["g-9", "g-7"] },
    { id: "g-12", label: "Backprop", group: "computer-science", parents: ["g-11"] },
    { id: "g-13", label: "CNNs", group: "computer-science", parents: ["g-12"] },
    { id: "g-14", label: "RNNs", group: "computer-science", parents: ["g-12"] },
    { id: "g-15", label: "Attention", group: "computer-science", parents: ["g-14"] },
    { id: "g-16", label: "Transformers", group: "computer-science", parents: ["g-15"] },
    { id: "g-17", label: "Diffusion", group: "computer-science", parents: ["g-16", "g-10"] },
    { id: "g-18", label: "Agents", group: "computer-science", parents: ["g-16"] },
    { id: "g-19", label: "RAG", group: "computer-science", parents: ["g-16", "g-2"] },
    { id: "g-20", label: "Tool use", group: "computer-science", parents: ["g-18"] },
    { id: "g-21", label: "Reinforcement learning", group: "computer-science", parents: ["g-10", "g-7"] },
    { id: "g-22", label: "RLHF", group: "computer-science", parents: ["g-21", "g-16"] },
    { id: "g-23", label: "Multi-agent systems", group: "computer-science", parents: ["g-18", "g-20"] },
    { id: "g-24", label: "Cognitive science", group: "psychology", parents: ["g-7"] },
    { id: "g-25", label: "Attention (psych)", group: "psychology", parents: ["g-24"] },
    { id: "g-26", label: "Working memory", group: "psychology", parents: ["g-24"] },
    { id: "g-27", label: "Metacognition", group: "psychology", parents: ["g-26"] },
    { id: "g-28", label: "Flow states", group: "psychology", parents: ["g-25"] },
    { id: "g-29", label: "Music theory", group: "music", parents: ["g-0"] },
    { id: "g-30", label: "Counterpoint", group: "music", parents: ["g-29"] },
    { id: "g-31", label: "Harmony", group: "music", parents: ["g-29"] },
    { id: "g-32", label: "Form analysis", group: "music", parents: ["g-30", "g-31"] },
    { id: "g-33", label: "Economics", group: "business", parents: ["g-8"] },
    { id: "g-34", label: "Market design", group: "business", parents: ["g-33"] },
    { id: "g-35", label: "Pricing power", group: "business", parents: ["g-34"] },
  ];

  for (const l of lineage) {
    nodes.push({
      id: l.id,
      label: l.label,
      group: l.group,
      type: "concept",
      importance: 0.5 + rng() * 0.5,
      score: 0.5 + rng() * 0.5,
      ts: now - rng() * 365 * 24 * 60 * 60 * 1000,
    });
    for (const p of l.parents) {
      edges.push({ source: p, target: l.id, type: "derived", weight: 0.6 + rng() * 0.4 });
    }
  }

  const lateral: [string, string][] = [
    ["g-15", "g-25"],
    ["g-26", "g-19"],
    ["g-32", "g-4"],
    ["g-30", "g-1"],
    ["g-35", "g-10"],
    ["g-23", "g-22"],
    ["g-17", "g-13"],
  ];
  for (const [a, b] of lateral) {
    edges.push({ source: a, target: b, type: "similar", weight: 0.4 + rng() * 0.5 });
  }

  return { nodes, edges };
}
