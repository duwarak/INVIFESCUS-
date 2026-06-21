"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CommunityPod, CommunityRegion, ModerationStatus } from "../../lib/community/types";
import {
  SocialProfile, SocialPost, ConnectionRequest, DirectMessage, SafetyPolicy,
} from "../../lib/community/social";

const CommunityMap = dynamic(() => import("../../components/community-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: "#94a3b8" }}>
      Loading MapLibre tiles…
    </div>
  ),
});

type TabKey = "atlas" | "network" | "feed" | "questions" | "profile" | "messages" | "agents";

interface AtlasResp {
  pods: CommunityPod[];
  regions: CommunityRegion[];
  totals: { pods: number; members: number; domains: number; flagged: number; pendingReview: number };
}

const TAB_DEFS: { key: TabKey; label: string; icon: string }[] = [
  { key: "atlas", label: "Atlas", icon: "🗺" },
  { key: "network", label: "My Network", icon: "👥" },
  { key: "feed", label: "Feed", icon: "📝" },
  { key: "questions", label: "Questions", icon: "❓" },
  { key: "profile", label: "Profile", icon: "👤" },
  { key: "messages", label: "Messages", icon: "💬" },
  { key: "agents", label: "Agents", icon: "🤖" },
];

const STATUS_COLORS: Record<ModerationStatus, { bg: string; fg: string; label: string }> = {
  approved: { bg: "#defaf6", fg: "#06b6a8", label: "approved" },
  pending_review: { bg: "#fff4e0", fg: "#f4a02e", label: "pending review" },
  flagged: { bg: "#ffeaf0", fg: "#ef476f", label: "flagged" },
  hidden: { bg: "#eef2f7", fg: "#64748b", label: "hidden" },
  archived: { bg: "#eef2f7", fg: "#64748b", label: "archived" },
};

const DOMAIN_COLOR: Record<string, string> = {
  Technology: "#5b8dff", Communication: "#06b6a8", Business: "#f4a02e",
  Music: "#ef476f", Psychology: "#9b6dff", Sports: "#22c55e",
  Mental_Models: "#0ea5e9", Design: "#ec4899", Mathematics: "#0ea5e9",
  academic: "#5b8dff", professional: "#9b6dff", personal: "#30d158",
  creative: "#ff66c4", health: "#06b6a8", financial: "#f4a02e", social: "#0ea5e9",
};

const TIER_COLOR: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c0c0", gold: "#ffd54a", platinum: "#a7e1ff",
};

export default function CommunityPage() {
  const [tab, setTab] = useState<TabKey>("atlas");
  const [atlas, setAtlas] = useState<AtlasResp | null>(null);
  const [me, setMe] = useState<SocialProfile | null>(null);
  const [safety, setSafety] = useState<SafetyPolicy | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [questions, setQuestions] = useState<SocialPost[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [threads, setThreads] = useState<DirectMessage[]>([]);
  const [suggestions, setSuggestions] = useState<SocialProfile[]>([]);
  const [followers, setFollowers] = useState<SocialProfile[]>([]);
  const [following, setFollowing] = useState<SocialProfile[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | "all">("all");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [ageMode, setAgeMode] = useState<"adult" | "under_16">("adult");
  const [discord, setDiscord] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fetch("/api/community/pods").then((r) => r.json()).then((j: AtlasResp) => setAtlas(j));
    fetch("/api/community/social?view=profile").then((r) => r.json()).then((j) => { setMe(j.me); setSafety(j.safety); });
    fetch("/api/community/social?view=feed").then((r) => r.json()).then((j) => setPosts(j.posts));
    fetch("/api/community/social?view=questions").then((r) => r.json()).then((j) => setQuestions(j.posts));
    fetch("/api/community/social?view=messages").then((r) => r.json()).then((j) => { setThreads(j.threads); setRequests(j.requests); });
    fetch("/api/community/social?view=network").then((r) => r.json()).then((j) => { setSuggestions(j.suggestions); setFollowers(j.followers); setFollowing(j.following); });
    fetch("/api/agents/status").then((r) => r.json()).then((j) => setAgents(j.agents));
  }, []);

  const filteredPods = useMemo(() => {
    if (!atlas) return [];
    return atlas.pods.filter((p) => {
      if (statusFilter !== "all" && p.moderation.status !== statusFilter) return false;
      if (ageMode === "under_16" && p.privacy === "public") return true;
      if (visibility === "private" && p.privacy !== "private") return false;
      return true;
    });
  }, [atlas, statusFilter, visibility, ageMode]);

  const selected = useMemo(() => atlas?.pods.find((p) => p.id === selectedPodId) ?? null, [atlas, selectedPodId]);
  const safetyDisabled = ageMode === "under_16" && safety?.canDM === false;

  return (
    <div className="apple-mesh-bg apple-font -m-6 p-8 min-h-[calc(100vh-3rem)]" style={{ color: "var(--apple-text)" }}>
      <header className="flex flex-wrap items-start justify-between gap-4 apple-fade-in mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="apple-pill"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#30d158" }} /> OSSN architecture · modcandy moderation</span>
            <span className="apple-pill">{TAB_DEFS.find((t) => t.key === tab)?.label}</span>
          </div>
          <h1 className="apple-display" style={{ fontSize: 36, lineHeight: 1.05 }}>Community Syndicate</h1>
          <p className="text-[14px] mt-2 max-w-3xl" style={{ color: "var(--apple-text-secondary)" }}>
            Invifescus people, pods, posts and direct messages — built on OSSN-style profile + connection
            model with modcandy moderation. Under-16 mode applies private-by-default + human-review screening.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ToggleSeg value={visibility} onChange={(v) => setVisibility(v as any)} options={[["public", "Public"], ["private", "Private"]]} />
          <ToggleSeg value={ageMode} onChange={(v) => setAgeMode(v as any)} options={[["adult", "16+"], ["under_16", "Under 16"]]} />
          <button onClick={() => setDiscord((d) => !d)} disabled={ageMode === "under_16"}
            className={discord ? "apple-button" : "apple-button-ghost"}
            style={{ padding: "8px 14px", fontSize: 12, background: discord ? "#5865F2" : undefined }}
          >
            {discord ? "✓ Discord connected" : "Connect Discord"}
          </button>
        </div>
      </header>

      <div className="flex items-center gap-1 mb-5 apple-card-strong rounded-[14px] p-1 overflow-x-auto">
        {TAB_DEFS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={tab === t.key ? "apple-button" : "apple-button-ghost"}
            style={{ padding: "8px 14px", fontSize: 12, whiteSpace: "nowrap" }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {ageMode === "under_16" && (
        <div className="apple-card-strong rounded-[20px] p-4 mb-5 flex items-start gap-3" style={{ borderColor: "#ff9f0a55" }}>
          <span style={{ fontSize: 22 }}>🧒</span>
          <div className="text-[12px]" style={{ color: "var(--apple-text)" }}>
            <strong style={{ color: "#ff9f0a" }}>Under-16 safety mode active.</strong>
            <span style={{ color: "var(--apple-text-secondary)" }}> Profile is guardian-only · DMs disabled · all posts queue for human moderation · discovery is hidden · Discord disabled · parental approval required for connection requests.</span>
          </div>
        </div>
      )}

      {tab === "atlas" && (
        <div className="grid grid-cols-12 gap-5">
          <aside className="col-span-3 apple-card-strong rounded-[20px] p-4 flex flex-col gap-4 max-h-[calc(100vh-280px)] overflow-auto">
            {atlas && (
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Pods" value={atlas.totals.pods} />
                <Stat label="Members" value={atlas.totals.members} />
                <Stat label="Domains" value={atlas.totals.domains} />
                <Stat label="Flagged" value={atlas.totals.flagged} accent="#ef476f" />
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--apple-text-tertiary)" }}>Moderation</div>
              <div className="flex flex-col gap-1">
                {(["all", "approved", "pending_review", "flagged"] as const).map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={statusFilter === s ? "apple-button" : "apple-button-ghost"}
                    style={{ padding: "5px 10px", fontSize: 11, justifyContent: "flex-start" }}
                  >
                    {s === "all" ? "All pods" : STATUS_COLORS[s as ModerationStatus].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--apple-text-tertiary)" }}>Pod list ({filteredPods.length})</div>
              <div className="flex flex-col gap-1">
                {filteredPods.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPodId(selectedPodId === p.id ? null : p.id)}
                    className="text-left text-[12px] rounded-md px-2 py-1.5 flex items-center gap-2"
                    style={{
                      background: selectedPodId === p.id ? "var(--apple-accent-soft)" : "transparent",
                      color: selectedPodId === p.id ? "var(--apple-text)" : "var(--apple-text-secondary)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[p.moderation.status].fg }} />
                    <span className="flex-1 truncate">{p.label}</span>
                    <span className="text-[10px] opacity-70">{p.memberCount}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <div className="col-span-6 apple-card-strong rounded-[20px] overflow-hidden" style={{ minHeight: 520 }}>
            {atlas ? (
              <CommunityMap pods={filteredPods} regions={atlas.regions} selectedId={selectedPodId} onSelect={(id) => setSelectedPodId(id || null)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center apple-shimmer">Loading atlas…</div>
            )}
          </div>
          <aside className="col-span-3 apple-card-strong rounded-[20px] p-5 flex flex-col gap-3">
            {selected ? <PodDetail pod={selected} discord={discord} disabledDM={!!safetyDisabled} /> : (
              <div style={{ color: "var(--apple-text-secondary)" }}>
                <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--apple-text-tertiary)" }}>Pod inspector</div>
                <p className="text-[12px] leading-relaxed">Click any marker to inspect. Each pod is a knowledge-graph cluster with members, upcoming events, and live moderation status.</p>
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === "network" && me && (
        <div className="grid grid-cols-12 gap-5">
          <section className="col-span-12 lg:col-span-8 apple-card-strong rounded-[24px] p-6">
            <SectionHeading title="Suggestions" subtitle={`Matched by knowledge-graph overlap · ${suggestions.length} people`} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((p) => <PersonRow key={p.id} p={p} ctaLabel={safetyDisabled ? "Request (parental)" : "Connect"} />)}
            </div>
            <div className="apple-divider my-5" />
            <SectionHeading title="Followers" subtitle={`${followers.length}`} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {followers.map((p) => <PersonRow key={p.id} p={p} ctaLabel="Follow back" />)}
            </div>
            <div className="apple-divider my-5" />
            <SectionHeading title="Following" subtitle={`${following.length}`} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {following.map((p) => <PersonRow key={p.id} p={p} ctaLabel="Message" />)}
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <ConnectionRequests requests={requests} />
            <NetworkStats me={me} />
          </aside>
        </div>
      )}

      {tab === "feed" && me && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
            <Composer me={me} value={draft} onChange={setDraft} disabled={!safety?.canPost} screening={safety?.contentScreening ?? "auto"} />
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <TrendingTags posts={posts} />
            <Composer me={me} compact value="" onChange={() => undefined} disabled={true} screening="auto" hint="Try posting from the main composer." />
          </aside>
        </div>
      )}

      {tab === "questions" && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 apple-card-strong rounded-[24px] p-6">
            <SectionHeading title="Open Questions" subtitle={`${questions.length} unanswered · powered by Socratic Coach Agent`} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {questions.map((q) => <QuestionCard key={q.id} q={q} />)}
            </div>
          </div>
        </div>
      )}

      {tab === "profile" && me && safety && <ProfileTab me={me} safety={safety} />}
      {tab === "messages" && me && <MessagesTab me={me} threads={threads} requests={requests} disabledDM={!!safetyDisabled} />}

      {tab === "agents" && <AgentsTab agents={agents} />}
    </div>
  );
}

function ToggleSeg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex items-center gap-0.5 rounded-[10px] p-0.5 border" style={{ borderColor: "var(--apple-hairline)" }}>
      {options.map(([v, lbl]) => (
        <button key={v} onClick={() => onChange(v)}
          className="text-[11px] px-2.5 py-1.5 rounded-md"
          style={{
            background: value === v ? "var(--apple-text)" : "transparent",
            color: value === v ? "#06080f" : "var(--apple-text-secondary)",
            fontWeight: value === v ? 600 : 400,
          }}
        >{lbl}</button>
      ))}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="apple-card p-3">
      <div className="text-[20px] font-semibold" style={{ color: accent ?? "var(--apple-text)" }}>{value.toLocaleString()}</div>
      <div className="text-[9px] uppercase tracking-[0.18em] mt-0.5" style={{ color: "var(--apple-text-tertiary)" }}>{label}</div>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--apple-text-tertiary)" }}>{subtitle}</div>
        <h3 className="apple-display text-[18px] mt-1">{title}</h3>
      </div>
    </div>
  );
}

function PersonRow({ p, ctaLabel }: { p: SocialProfile; ctaLabel: string }) {
  return (
    <div className="apple-card p-3 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full shrink-0 grid place-items-center font-bold" style={{ background: p.avatarColor, color: "#fff" }}>
        {p.fullName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate" style={{ color: "var(--apple-text)" }}>{p.fullName}</div>
        <div className="text-[10px]" style={{ color: "var(--apple-text-tertiary)" }}>@{p.handle} · {p.location}</div>
        <div className="text-[11px] mt-1 line-clamp-2" style={{ color: "var(--apple-text-secondary)" }}>{p.bio}</div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {p.skills.slice(0, 3).map((s) => <span key={s.name} className="apple-pill" style={{ fontSize: 9 }}>{s.name}</span>)}
        </div>
      </div>
      <button className="apple-button" style={{ padding: "6px 10px", fontSize: 11 }}>{ctaLabel}</button>
    </div>
  );
}

function ConnectionRequests({ requests }: { requests: ConnectionRequest[] }) {
  return (
    <div className="apple-card-strong rounded-[20px] p-5">
      <SectionHeading title="Pending requests" subtitle={`${requests.length} waiting`} />
      <div className="flex flex-col gap-2">
        {requests.map((r) => (
          <div key={r.id} className="apple-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold" style={{ color: "var(--apple-text)" }}>{r.fromName}</div>
              <div className="text-[10px]" style={{ color: "var(--apple-text-tertiary)" }}>{Math.round((Date.now() - new Date(r.createdISO).getTime()) / 86400000)}d</div>
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--apple-text-secondary)" }}>{r.reason}</p>
            <div className="flex gap-1.5 mt-2">
              <button className="apple-button" style={{ padding: "5px 10px", fontSize: 10 }}>Accept</button>
              <button className="apple-button-ghost" style={{ padding: "5px 10px", fontSize: 10 }}>Decline</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkStats({ me }: { me: SocialProfile }) {
  return (
    <div className="apple-card-strong rounded-[20px] p-5">
      <SectionHeading title="Your network" subtitle="overview" />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Connections" value={me.connections} />
        <Stat label="Followers" value={me.followers} />
      </div>
    </div>
  );
}

function Composer({ me, value, onChange, disabled, screening, compact, hint }: { me: SocialProfile; value: string; onChange: (v: string) => void; disabled: boolean; screening: string; compact?: boolean; hint?: string }) {
  return (
    <div className="apple-card-strong rounded-[24px] p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full grid place-items-center font-bold shrink-0" style={{ background: me.avatarColor, color: "#fff" }}>{me.fullName.charAt(0)}</div>
        <div className="flex-1">
          {hint ? (
            <div className="text-[12px] py-3" style={{ color: "var(--apple-text-tertiary)" }}>{hint}</div>
          ) : (
            <>
              <textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="Share what you learned, ask a question, or post a new creation…"
                className="w-full px-3 py-2 rounded-[12px] outline-none"
                rows={compact ? 2 : 3}
                style={{ background: "var(--apple-glass-bg-light)", border: "1px solid var(--apple-hairline)", color: "var(--apple-text)", fontSize: 14, resize: "vertical" }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px]" style={{ color: "var(--apple-text-tertiary)" }}>
                  {disabled ? "Posting disabled for current safety mode" : `Pre-screening: ${screening}`}
                </span>
                <button className="apple-button" disabled={disabled || !value.trim()} style={{ padding: "8px 16px", fontSize: 12 }}>Post</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const mod = post.moderation;
  const modColor = mod === "approved" ? "#30d158" : mod === "pending_review" ? "#ff9f0a" : "#ef476f";
  return (
    <div className="apple-card-strong rounded-[20px] p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[12px] font-semibold" style={{ color: "var(--apple-text)" }}>{post.authorName}</div>
          <div className="text-[10px]" style={{ color: "var(--apple-text-tertiary)" }}>
            {post.type.replace("_", " ")} · {new Date(post.createdISO).toLocaleString()}
          </div>
        </div>
        <span className="apple-pill" style={{ color: modColor, borderColor: `${modColor}55` }}>● {mod}</span>
      </div>
      {post.imageEmoji && <div className="text-[44px] mb-2">{post.imageEmoji}</div>}
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--apple-text)" }}>{post.content}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {post.domain && (
          <span className="apple-pill" style={{ background: `${DOMAIN_COLOR[post.domain] ?? "#94a3b8"}22`, color: DOMAIN_COLOR[post.domain] ?? "#94a3b8" }}>{post.domain}</span>
        )}
        {post.tags.slice(0, 4).map((t) => <span key={t} className="apple-pill" style={{ fontSize: 9 }}>{t}</span>)}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: "var(--apple-text-secondary)" }}>
        <span>❤ {post.likes}</span>
        <span>💬 {post.comments}</span>
        <span>↻ {post.reshares}</span>
      </div>
    </div>
  );
}

function QuestionCard({ q }: { q: SocialPost }) {
  return (
    <div className="apple-card p-4">
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--apple-text-tertiary)" }}>
        {q.authorName} · {new Date(q.createdISO).toLocaleDateString()}
      </div>
      <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--apple-text)" }}>{q.content}</p>
      <div className="flex items-center gap-2 mt-2">
        <button className="apple-button" style={{ padding: "5px 10px", fontSize: 10 }}>Answer</button>
        <button className="apple-button-ghost" style={{ padding: "5px 10px", fontSize: 10 }}>Save</button>
        <span className="text-[10px] ml-auto" style={{ color: "var(--apple-text-tertiary)" }}>{q.comments} replies</span>
      </div>
    </div>
  );
}

function TrendingTags({ posts }: { posts: SocialPost[] }) {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const trending = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
  return (
    <div className="apple-card-strong rounded-[20px] p-5">
      <SectionHeading title="Trending tags" subtitle="across the feed" />
      <div className="flex flex-wrap gap-1.5">
        {trending.map(([t, n]) => (
          <span key={t} className="apple-pill" style={{ fontSize: 10 }}>#{t} <span style={{ color: "var(--apple-text-tertiary)", marginLeft: 4 }}>· {n}</span></span>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({ me, safety }: { me: SocialProfile; safety: SafetyPolicy }) {
  return (
    <div className="grid grid-cols-12 gap-5">
      <section className="col-span-12 lg:col-span-8 apple-card-strong rounded-[24px] p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full grid place-items-center font-bold text-2xl shrink-0" style={{ background: me.avatarColor, color: "#fff" }}>{me.fullName.charAt(0)}</div>
          <div className="flex-1">
            <div className="apple-display text-[24px]">{me.fullName}</div>
            <div className="text-[12px]" style={{ color: "var(--apple-text-tertiary)" }}>@{me.handle} · {me.location} · joined {new Date(me.joinedISO).toLocaleDateString()}</div>
            <p className="text-[13px] mt-1.5" style={{ color: "var(--apple-text)" }}>{me.bio}</p>
            <div className="flex gap-3 mt-2 text-[11px]" style={{ color: "var(--apple-text-secondary)" }}>
              <span><strong style={{ color: "var(--apple-text)" }}>{me.connections}</strong> connections</span>
              <span><strong style={{ color: "var(--apple-text)" }}>{me.followers}</strong> followers</span>
              <span>trust: <strong style={{ color: "#30d158" }}>{me.trustLevel}</strong></span>
            </div>
          </div>
        </div>
        <div className="apple-divider my-4" />
        <SectionHeading title="Skills" subtitle="ratings across your tracked domains" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {me.skills.map((s) => (
            <div key={s.name} className="apple-card p-3">
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: "var(--apple-text)", fontWeight: 600 }}>{s.name}</span>
                <span style={{ color: "var(--apple-accent)" }}>{(s.rating * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full mt-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-1.5 rounded-full" style={{ width: `${s.rating * 100}%`, background: "linear-gradient(90deg,#5b8dff,#9b6dff)" }} />
              </div>
            </div>
          ))}
        </div>
        <div className="apple-divider my-4" />
        <SectionHeading title="Standards / badges" subtitle="earned milestones" />
        <div className="flex flex-wrap gap-3">
          {me.standards.map((b) => (
            <div key={b.name} className="apple-card px-4 py-3 flex items-center gap-3">
              <span style={{ fontSize: 26 }}>{b.emoji}</span>
              <div>
                <div className="text-[12px] font-semibold" style={{ color: "var(--apple-text)" }}>{b.name}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: TIER_COLOR[b.tier] }}>{b.tier}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="apple-divider my-4" />
        <SectionHeading title="Goals" subtitle="what you're optimizing for" />
        <ul className="text-[13px] flex flex-col gap-1.5" style={{ color: "var(--apple-text)" }}>
          {me.goals.map((g, i) => <li key={g}><span style={{ color: "var(--apple-accent)" }}>{i + 1}. </span>{g}</li>)}
        </ul>
      </section>
      <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
        <div className="apple-card-strong rounded-[20px] p-5">
          <SectionHeading title="Safety policy" subtitle={`age bracket: ${me.ageBracket}`} />
          <div className="text-[11px] space-y-1" style={{ color: "var(--apple-text-secondary)" }}>
            <div>Visibility: <strong style={{ color: "var(--apple-text)" }}>{safety.visibility}</strong></div>
            <div>DM enabled: <strong style={{ color: safety.canDM ? "#30d158" : "#ef476f" }}>{safety.canDM ? "yes" : "no"}</strong></div>
            <div>Posting: <strong style={{ color: safety.canPost ? "#30d158" : "#ef476f" }}>{safety.canPost ? "enabled" : "disabled"}</strong></div>
            <div>Content screening: <strong style={{ color: "var(--apple-text)" }}>{safety.contentScreening}</strong></div>
            <div>Daily interaction cap: <strong style={{ color: "var(--apple-text)" }}>{safety.dailyInteractionCap}</strong></div>
          </div>
          <div className="apple-divider my-3" />
          <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--apple-text-tertiary)" }}>Notes</div>
          <ul className="text-[11px] flex flex-col gap-1" style={{ color: "var(--apple-text)" }}>
            {safety.notes.map((n, i) => <li key={i}>· {n}</li>)}
          </ul>
        </div>
        <div className="apple-card-strong rounded-[20px] p-5">
          <SectionHeading title="External" subtitle="connections" />
          <div className="text-[11px]" style={{ color: "var(--apple-text-secondary)" }}>
            Discord: <strong style={{ color: me.discordConnected ? "#5865F2" : "var(--apple-text-tertiary)" }}>{me.discordConnected ? "connected" : "not connected"}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MessagesTab({ me, threads, requests, disabledDM }: { me: SocialProfile; threads: DirectMessage[]; requests: ConnectionRequest[]; disabledDM: boolean }) {
  const [active, setActive] = useState<DirectMessage | null>(threads[0] ?? null);
  useEffect(() => { setActive(threads[0] ?? null); }, [threads]);
  return (
    <div className="grid grid-cols-12 gap-5">
      <aside className="col-span-4 apple-card-strong rounded-[24px] p-4">
        <SectionHeading title="Inbox" subtitle={`${threads.length} threads · ${requests.length} requests`} />
        <div className="flex flex-col gap-1">
          {threads.map((t) => (
            <button key={t.id} onClick={() => setActive(t)}
              className="text-left p-3 rounded-[12px]"
              style={{ background: active?.id === t.id ? "var(--apple-accent-soft)" : "transparent" }}
            >
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold" style={{ color: "var(--apple-text)" }}>{t.fromName}</div>
                {!t.read && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#5b8dff" }} />}
              </div>
              <div className="text-[11px] mt-0.5 truncate" style={{ color: "var(--apple-text-secondary)" }}>{t.content}</div>
            </button>
          ))}
        </div>
      </aside>
      <section className="col-span-8 apple-card-strong rounded-[24px] p-6 flex flex-col" style={{ minHeight: 420 }}>
        {disabledDM ? (
          <div className="m-auto text-center" style={{ color: "var(--apple-text-secondary)" }}>
            <div className="text-[28px] mb-2">🛡</div>
            <div className="text-[13px]">Direct messaging is disabled in Under-16 safety mode.</div>
          </div>
        ) : active ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full grid place-items-center font-bold" style={{ background: "#5b8dff", color: "#fff" }}>{active.fromName.charAt(0)}</div>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: "var(--apple-text)" }}>{active.fromName}</div>
                <div className="text-[10px]" style={{ color: "var(--apple-text-tertiary)" }}>moderation: {active.moderation}</div>
              </div>
            </div>
            <div className="apple-card p-4 max-w-[80%]" style={{ color: "var(--apple-text)" }}>
              <p className="text-[12px]">{active.content}</p>
              <div className="text-[10px] mt-2" style={{ color: "var(--apple-text-tertiary)" }}>{new Date(active.sentISO).toLocaleString()}</div>
            </div>
            <div className="mt-auto pt-4">
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 rounded-[12px] outline-none" placeholder="Reply…" style={{ background: "var(--apple-glass-bg-light)", border: "1px solid var(--apple-hairline)", color: "var(--apple-text)", fontSize: 13 }} />
                <button className="apple-button" style={{ padding: "8px 16px", fontSize: 12 }}>Send</button>
              </div>
              <div className="text-[10px] mt-2" style={{ color: "var(--apple-text-tertiary)" }}>All messages screened by modcandy before delivery.</div>
            </div>
          </>
        ) : (
          <div className="m-auto" style={{ color: "var(--apple-text-tertiary)" }}>Pick a thread.</div>
        )}
      </section>
    </div>
  );
}

function AgentsTab({ agents }: { agents: any[] }) {
  const layers = Array.from(new Set(agents.map((a) => a.layer)));
  return (
    <div className="apple-card-strong rounded-[24px] p-6">
      <SectionHeading title={`${agents.length} backend agents`} subtitle="layered orchestrator · stored in MemPalace" />
      {layers.map((L) => (
        <div key={L} className="mb-5">
          <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--apple-text-tertiary)" }}>{L}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.filter((a) => a.layer === L).map((a) => (
              <div key={a.id} className="apple-card p-3">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>{a.emoji}</span>
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold" style={{ color: "var(--apple-text)" }}>{a.name}</div>
                    <div className="text-[10px]" style={{ color: a.color }}>
                      {a.status} · heartbeat {a.heartbeatMs}ms
                    </div>
                  </div>
                </div>
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color: "var(--apple-text-secondary)" }}>{a.description}</p>
                <div className="text-[10px] mt-2" style={{ color: "var(--apple-text-tertiary)" }}>
                  ➜ <strong style={{ color: "var(--apple-text)" }}>{a.lastAction}</strong>
                </div>
                <div className="text-[10px] mt-1" style={{ color: "var(--apple-accent)" }}>{a.storesIn}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PodDetail({ pod, discord, disabledDM }: { pod: CommunityPod; discord: boolean; disabledDM: boolean }) {
  const sc = STATUS_COLORS[pod.moderation.status];
  return (
    <div className="flex flex-col gap-3">
      <h3 className="apple-display text-[16px]" style={{ color: "var(--apple-text)" }}>{pod.label}</h3>
      <div className="flex gap-1.5 flex-wrap text-[10px]">
        <span className="apple-pill" style={{ background: sc.bg, color: sc.fg }}>● {sc.label}</span>
        <span className="apple-pill">density {pod.knowledgeDensity}</span>
        <span className="apple-pill">{pod.memberCount} members</span>
      </div>
      <p className="text-[12px]" style={{ color: "var(--apple-text)" }}>{pod.description}</p>
      <div className="flex flex-wrap gap-1">
        {pod.domains.map((d) => <span key={d} className="apple-pill" style={{ fontSize: 9, background: `${DOMAIN_COLOR[d] ?? "#94a3b8"}22`, color: DOMAIN_COLOR[d] ?? "#94a3b8" }}>{d}</span>)}
      </div>
      {pod.nextEvent && (
        <div className="apple-card p-3">
          <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--apple-text-tertiary)" }}>Next event</div>
          <div className="text-[12px] font-semibold" style={{ color: "var(--apple-text)" }}>{pod.nextEvent.title}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--apple-text-tertiary)" }}>{new Date(pod.nextEvent.whenISO).toUTCString()}</div>
        </div>
      )}
      <button disabled={disabledDM} className="apple-button" style={{ padding: "8px 12px", fontSize: 12 }}>
        Request to join
      </button>
      {discord && <button className="apple-button-ghost" style={{ background: "#5865F2", color: "#fff", padding: "8px 12px", fontSize: 12 }}>Bridge to Discord</button>}
    </div>
  );
}
