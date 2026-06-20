"use client";

import { useState } from "react";

// MOCKED DATA — no live backend, no real geolocation
// This is a static demo with seeded avatars for the hackathon submission
const MOCK_USERS = [
  {
    id: "u1",
    name: "Alex",
    avatar: "🧠",
    x: 180,
    y: 120,
    tags: ["Systems thinking", "Cross-domain linker"],
    domains: ["CS", "Music"],
    matchReason: "Shares your strongest bridge: CS ↔ Music structural patterns",
  },
  {
    id: "u2",
    name: "Priya",
    avatar: "⚡",
    x: 420,
    y: 200,
    tags: ["Decision-pressure tested", "Premortem specialist"],
    domains: ["Business", "Psychology"],
    matchReason: "Strong where you have gaps: Business decision frameworks",
  },
  {
    id: "u3",
    name: "Marcus",
    avatar: "🎯",
    x: 300,
    y: 320,
    tags: ["Physical discipline", "Energy optimizer"],
    domains: ["Gymnastics", "Nutrition"],
    matchReason: "Complementary: your Gymnastics concepts + their energy optimization",
  },
  {
    id: "u4",
    name: "Yuki",
    avatar: "🔬",
    x: 520,
    y: 100,
    tags: ["Research methodology", "First principles"],
    domains: ["Physics", "CS"],
    matchReason: "Shares your decomposition pattern, applies it to physics",
  },
];

export default function CommunityPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedUser = MOCK_USERS.find((u) => u.id === selected);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Community map</h2>
        <p className="text-sm text-polymath-muted mt-1">
          People matched by knowledge-map overlap — not proximity, not profile swiping. Each avatar represents earned skill tags from real daily reflections.
        </p>
        <p className="text-xs text-polymath-coral mt-2">
          Demo: static mocked data. Live matching requires multiple active users.
        </p>
      </div>

      {/* Map area */}
      <div className="relative bg-polymath-surface border border-polymath-border rounded-lg overflow-hidden" style={{ height: 420 }}>
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8888a0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* You (center) */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: 320, top: 210, transform: "translate(-50%, -50%)" }}
        >
          <div className="w-12 h-12 rounded-full bg-polymath-accent flex items-center justify-center text-xl ring-2 ring-polymath-accent/50 ring-offset-2 ring-offset-polymath-surface">
            🌟
          </div>
          <span className="text-xs text-polymath-accent mt-1 font-medium">You</span>
        </div>

        {/* Other users */}
        {MOCK_USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => setSelected(user.id === selected ? null : user.id)}
            className={`absolute flex flex-col items-center transition-transform hover:scale-110 ${
              selected === user.id ? "scale-110" : ""
            }`}
            style={{ left: user.x, top: user.y, transform: "translate(-50%, -50%)" }}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-colors ${
                selected === user.id
                  ? "border-polymath-teal bg-polymath-teal/10"
                  : "border-polymath-border bg-polymath-bg"
              }`}
            >
              {user.avatar}
            </div>
            <span className="text-xs text-polymath-muted mt-1">{user.name}</span>
          </button>
        ))}

        {/* Connection lines (dashed, to show potential not actual connections) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {MOCK_USERS.map((user) => (
            <line
              key={user.id}
              x1={320}
              y1={210}
              x2={user.x}
              y2={user.y}
              stroke={selected === user.id ? "#2dd4bf" : "#2a2a3a"}
              strokeWidth={selected === user.id ? 1.5 : 0.5}
              strokeDasharray={selected === user.id ? "none" : "4 4"}
            />
          ))}
        </svg>
      </div>

      {/* Selected user detail */}
      {selectedUser && (
        <div className="mt-4 bg-polymath-surface border border-polymath-teal/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{selectedUser.avatar}</span>
            <div>
              <h3 className="font-medium text-polymath-text">{selectedUser.name}</h3>
              <p className="text-xs text-polymath-muted">
                Domains: {selectedUser.domains.join(", ")}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mb-3">
            {selectedUser.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded bg-polymath-teal/10 text-polymath-teal"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-sm text-polymath-muted mb-4">{selectedUser.matchReason}</p>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-polymath-teal text-polymath-bg rounded-lg text-sm font-medium hover:bg-polymath-teal/80 transition-colors">
              Request connection
            </button>
            <span className="px-4 py-2 text-xs text-polymath-muted flex items-center">
              Requires connection game + approval
            </span>
          </div>
        </div>
      )}

      {/* Safety note */}
      <div className="mt-4 bg-polymath-surface border border-polymath-border rounded-lg p-4">
        <h3 className="text-xs font-medium text-polymath-muted mb-2">Safety architecture (active)</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-polymath-muted">
          <span>→ Location fuzzed to ~1km zones</span>
          <span>→ Sharing opt-in, time-limited</span>
          <span>→ Under-20 users: parent portal approval</span>
          <span>→ Behavioral pattern detection → human review</span>
        </div>
      </div>
    </div>
  );
}
