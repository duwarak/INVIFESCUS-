import { loadSchemaDataset } from "../training/loader";

export type AgeBracket = "under_16" | "16-22" | "23-30" | "31-40" | "41+";
export type Visibility = "public" | "private" | "guardian_only";
export type TrustLevel = "new" | "trusted" | "moderator";

export interface SocialProfile {
  id: string;
  handle: string;
  fullName: string;
  bio: string;
  pronouns?: string;
  ageBracket: AgeBracket;
  role: string;
  location: string;
  visibility: Visibility;
  trustLevel: TrustLevel;
  joinedISO: string;
  avatarColor: string;
  skills: { name: string; rating: number }[];
  standards: { name: string; emoji: string; tier: "bronze" | "silver" | "gold" | "platinum" }[];
  goals: string[];
  connections: number;
  followers: number;
  isUnder16: boolean;
  discordConnected: boolean;
  parentalApprovalNeeded: boolean;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  type: "creation" | "question" | "milestone" | "shared_concept";
  content: string;
  domain?: string;
  tags: string[];
  createdISO: string;
  likes: number;
  comments: number;
  reshares: number;
  moderation: "approved" | "pending_review" | "shadow_limited";
  imageEmoji?: string;
}

export interface ConnectionRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromHandle: string;
  reason: string;
  createdISO: string;
  status: "pending" | "accepted" | "declined";
  sharedInterests: string[];
}

export interface DirectMessage {
  id: string;
  threadId: string;
  fromId: string;
  fromName: string;
  toId: string;
  content: string;
  sentISO: string;
  read: boolean;
  moderation: "approved" | "screened" | "blocked";
}

const HANDLES = ["polymath_one", "lattice_lab", "decompose_me", "stacked_minds", "bridge_walker", "thinkforge", "neuro_jam", "sigma_steps", "wave_logic", "atlas_runner"];
const SKILLS = ["Decomposition", "Public Speaking", "Pre-mortem", "Mind Mapping", "Cross-domain Transfer", "Spaced Repetition", "Counterpoint", "Pattern Recognition", "Bayesian Updating", "Systems Thinking"];
const STANDARDS = [
  { name: "Daily Streak 30", emoji: "🔥", tier: "silver" as const },
  { name: "Synthesis Master", emoji: "🌉", tier: "gold" as const },
  { name: "Pre-mortem Pro", emoji: "🛡", tier: "gold" as const },
  { name: "Polymath Sigil", emoji: "✺", tier: "platinum" as const },
  { name: "Concept Cartographer", emoji: "🗺", tier: "silver" as const },
  { name: "First Bridge", emoji: "🌟", tier: "bronze" as const },
];

const COLORS = ["#5b8dff", "#9b6dff", "#30d158", "#ff66c4", "#ff9f0a", "#0ea5e9", "#06b6a8", "#f4a02e", "#ef476f"];

function ageBracketForRole(role: string, index: number): AgeBracket {
  if (role === "UG_student") {
    return index % 5 === 0 ? "under_16" : "16-22";
  }
  if (role === "PG_student") return "16-22";
  if (role === "professional") return "23-30";
  if (role === "entrepreneur") return "31-40";
  return "23-30";
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function loadProfiles(): SocialProfile[] {
  const ds = loadSchemaDataset();
  return ds.data.users.map((u: any, i: number) => {
    const ageBracket = ageBracketForRole(u.role, i);
    const isUnder16 = ageBracket === "under_16";
    const visibility: Visibility = isUnder16 ? "guardian_only" : i % 3 === 0 ? "private" : "public";
    return {
      id: u.user_id,
      handle: HANDLES[i % HANDLES.length] + "_" + (i + 1),
      fullName: `User ${i + 1} · ${u.role.replace("_", " ")}`,
      bio: `${u.goals.slice(0, 2).join(" · ")}. Routine: ${u.routines[0]}.`,
      ageBracket,
      role: u.role,
      location: u.location,
      visibility,
      trustLevel: isUnder16 ? "new" : i % 7 === 0 ? "moderator" : "trusted",
      joinedISO: new Date(Date.now() - (i + 1) * 60 * 86400000).toISOString(),
      avatarColor: COLORS[i % COLORS.length],
      skills: u.skill_areas.slice(0, 5).map((name: string, j: number) => ({
        name,
        rating: 0.5 + ((hash(u.user_id + name) % 50) / 100),
      })),
      standards: [STANDARDS[i % STANDARDS.length], STANDARDS[(i + 2) % STANDARDS.length]],
      goals: u.goals,
      connections: 12 + (hash(u.user_id) % 240),
      followers: 30 + (hash(u.user_id + "f") % 800),
      isUnder16,
      discordConnected: !isUnder16 && i % 4 === 0,
      parentalApprovalNeeded: isUnder16,
    };
  });
}

export function loadPosts(): SocialPost[] {
  const profiles = loadProfiles();
  const ds = loadSchemaDataset();
  const inputs = ds.data.input_items.slice(0, 30);
  const concepts = ds.data.concept_extractions;
  const conceptByInput = new Map(concepts.map((c: any) => [c.input_id, c]));

  const postTypes: SocialPost["type"][] = ["creation", "question", "milestone", "shared_concept"];
  const imageEmojis = ["📘", "🧠", "🎻", "🛠", "✍️", "🪄", "🪞", "🌀", "🔭", "🪜", "🪂"];

  return inputs.map((it: any, i: number) => {
    const p = profiles[i % profiles.length];
    const c = conceptByInput.get(it.input_id) as any;
    const type = postTypes[i % postTypes.length];
    const content =
      type === "question"
        ? `Question: how did you first apply ${c?.topic ?? "this concept"} outside ${c?.domain ?? "your field"}?`
        : type === "milestone"
          ? `Milestone unlocked: ${c?.topic ?? "a new concept"} clicked into place today. ${it.content.slice(0, 90)}`
          : type === "shared_concept"
            ? `Sharing today's bridge: ${c?.topic ?? "—"} → ${c?.subtopic ?? "—"}. Anyone else seeing this pattern?`
            : `Just shipped: ${it.content.slice(0, 140)}`;
    return {
      id: `post_${i}`,
      authorId: p.id,
      authorName: p.fullName,
      type,
      content,
      domain: c?.domain,
      tags: c?.tags ?? [],
      createdISO: it.timestamp,
      likes: 4 + (hash(it.input_id) % 240),
      comments: hash(it.input_id + "c") % 28,
      reshares: hash(it.input_id + "r") % 14,
      moderation: i % 11 === 0 ? "pending_review" : i % 19 === 0 ? "shadow_limited" : "approved",
      imageEmoji: i % 3 === 0 ? imageEmojis[i % imageEmojis.length] : undefined,
    };
  });
}

export function loadRequests(meId: string): ConnectionRequest[] {
  const profiles = loadProfiles().filter((p) => p.id !== meId);
  return profiles.slice(0, 6).map((p, i) => ({
    id: `req_${i}`,
    fromId: p.id,
    fromName: p.fullName,
    fromHandle: p.handle,
    reason: `Shares ${p.skills[0]?.name ?? "interest"} and learning ${p.goals[0] ?? "polymath skills"}.`,
    createdISO: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    status: "pending",
    sharedInterests: p.skills.slice(0, 3).map((s) => s.name),
  }));
}

export function loadMessages(meId: string): DirectMessage[] {
  const profiles = loadProfiles().filter((p) => p.id !== meId).slice(0, 5);
  const snippets = [
    "Hey — your last bridge post helped me re-think a project decomposition. Want to compare notes?",
    "Saw you joined the Mumbai Mind Map pod. Are you going on Saturday?",
    "Could you share the pre-mortem template? I want to run one on my thesis.",
    "Heard you switched from the daily plan to the weekly synthesis. How's it going?",
    "The decision lab spat out an interesting scenario — DM I'll forward you the link.",
  ];
  return profiles.map((p, i) => ({
    id: `dm_${i}`,
    threadId: `t_${p.id}`,
    fromId: p.id,
    fromName: p.fullName,
    toId: meId,
    content: snippets[i % snippets.length],
    sentISO: new Date(Date.now() - i * 3 * 3600000).toISOString(),
    read: i > 2,
    moderation: i === 4 ? "screened" : "approved",
  }));
}

export function loadMyProfile(): SocialProfile {
  return {
    id: "u_me",
    handle: "you_polymath",
    fullName: "You · Polymath",
    bio: "Connecting decomposition, decision lab and the daily synthesis. Bridge-builder by routine.",
    ageBracket: "16-22",
    role: "UG_student",
    location: "Chennai, India",
    visibility: "public",
    trustLevel: "trusted",
    joinedISO: new Date(Date.now() - 90 * 86400000).toISOString(),
    avatarColor: "#5b8dff",
    skills: SKILLS.slice(0, 6).map((name, i) => ({ name, rating: 0.45 + (i * 0.08) })),
    standards: [STANDARDS[0], STANDARDS[1], STANDARDS[2], STANDARDS[5]],
    goals: ["become a polymath thinker", "ship the second brain MVP", "host a local Polymath Salon"],
    connections: 184,
    followers: 612,
    isUnder16: false,
    discordConnected: false,
    parentalApprovalNeeded: false,
  };
}

export interface SafetyPolicy {
  visibility: Visibility;
  canDM: boolean;
  canPost: boolean;
  canReceiveRequests: boolean;
  requiresParentalApproval: boolean;
  contentScreening: "auto" | "auto+human" | "human_only";
  dailyInteractionCap: number;
  notes: string[];
}

export function safetyFor(p: Pick<SocialProfile, "ageBracket" | "trustLevel">): SafetyPolicy {
  if (p.ageBracket === "under_16") {
    return {
      visibility: "guardian_only",
      canDM: false,
      canPost: true,
      canReceiveRequests: false,
      requiresParentalApproval: true,
      contentScreening: "human_only",
      dailyInteractionCap: 8,
      notes: [
        "Private-by-default profile.",
        "Discovery + search exposure disabled.",
        "Direct messaging disabled; group chat is moderator-only.",
        "All posts queue for human moderation before publish.",
        "Parental/guardian review required on connection requests.",
        "Aggressive automated harmful-content screening on every message.",
      ],
    };
  }
  if (p.trustLevel === "new") {
    return {
      visibility: "public",
      canDM: true,
      canPost: true,
      canReceiveRequests: true,
      requiresParentalApproval: false,
      contentScreening: "auto+human",
      dailyInteractionCap: 30,
      notes: [
        "Standard discoverability + reporting.",
        "Automated screening on every message.",
        "Rate-limited until trust level rises.",
      ],
    };
  }
  return {
    visibility: "public",
    canDM: true,
    canPost: true,
    canReceiveRequests: true,
    requiresParentalApproval: false,
    contentScreening: "auto",
    dailyInteractionCap: 200,
    notes: [
      "Full networking + posting enabled.",
      "Automated harmful-content screening still applied.",
      "Temporary interaction limits triggered on abuse spikes.",
    ],
  };
}
