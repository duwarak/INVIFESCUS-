export interface SkillSpec {
  name: string;
  description: string;
  triggers: string[];
  body: string;
}

export const SKILLS: SkillSpec[] = [
  {
    name: "polymath-markdown",
    description:
      "Read, write, and link knowledge in polymath-flavored markdown with wikilinks, frontmatter, and cross-domain tags. Use when the user mentions notes, vault, wikilinks, frontmatter, or tags.",
    triggers: ["note", "vault", "wikilink", "frontmatter", "tags"],
    body: `# polymath-markdown

## Wikilinks
[[Concept Name]]            Link to concept
[[Concept Name|Display]]    Custom display
[[Concept Name#Section]]    Link to section

## Frontmatter
---
id: concept:transformers
type: Concept
group: Technology
tags: [ai-first, polymath]
aliases: [transformer models]
created: 2026-06-20
ai-first: true
for-future-claude: |
  Two-sentence self-contained summary so any agent picking
  up this note tomorrow can act without back-context.
---

## Cross-domain marker
> [!bridge] Cross-domain
> This concept bridges Technology and Music via decomposition.
`,
  },
  {
    name: "convergence-detection",
    description:
      "Find nodes that bridge two or more clusters in the brain graph. Use when the user mentions hidden patterns, polymath connections, unnamed insights, or hub concepts.",
    triggers: ["convergence", "bridge", "polymath", "hub", "cross-domain"],
    body: `# convergence-detection

1. Compute domain-set of every node's 1-hop neighbors.
2. Mark nodes whose neighbor domains exceed 2 distinct groups.
3. Rank by (domain_count × neighbor_count × bridge_weight).
4. Return top-K with the unnamed-pattern label slot empty for the
   Cross-Domain Synthesis Agent to name later.
`,
  },
  {
    name: "orphan-rescue",
    description:
      "Detect zero-backlink concepts and propose new edges via embedding similarity. Use when the user mentions orphans, missing links, or stale notes.",
    triggers: ["orphan", "stale", "missing link", "disconnected"],
    body: `# orphan-rescue

1. Identify nodes with no inbound and no outbound edges.
2. For each orphan, compute label embedding.
3. Suggest top-3 candidate neighbors by cosine similarity.
4. Surface as Inspector recommendations the user can accept.
`,
  },
  {
    name: "for-future-claude",
    description:
      "Generate the self-contained 2-3 sentence summary every node carries so future agents can act without crawling backlinks. Use when a new node enters MemPalace.",
    triggers: ["future-claude", "summary", "preamble"],
    body: `# for-future-claude

Output template:

> What this is: <one sentence>.
> Why it matters: <one sentence about leverage and bridges>.
> Watch-outs: <one sentence on bias, scope, or confidence>.
`,
  },
];

export function pickSkills(query: string): SkillSpec[] {
  const q = query.toLowerCase();
  return SKILLS.filter((s) =>
    s.triggers.some((t) => q.includes(t)) || q.includes(s.name)
  );
}
