"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DashboardData } from "@/lib/dashboard/types";

const DashboardCarousel = dynamic(() => import("@/components/dashboard/dashboard-carousel"), {
  ssr: false,
  loading: () => (
    <div className="apple-card-strong rounded-[28px] h-[640px] apple-shimmer flex items-center justify-center" style={{ color: "var(--apple-text-secondary)" }}>
      Loading dashboard…
    </div>
  ),
});

const SOURCE_CATEGORY_LABEL: Record<string, string> = {
  graph: "Graph",
  map: "Map",
  timeseries: "Time-Series",
  mindmap: "Mind-Map",
  core: "Core / Memory",
};
const SOURCE_CATEGORY_COLOR: Record<string, string> = {
  graph: "#5b8dff",
  map: "#30d158",
  timeseries: "#ff9f0a",
  mindmap: "#ff66c4",
  core: "rgba(245,245,247,0.9)",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then((r) => r.json())
      .then((j: DashboardData) => setData(j))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="apple-mesh-bg apple-font -m-6 p-8 min-h-[calc(100vh-3rem)]" style={{ color: "var(--apple-text)" }}>
      <header className="flex items-end justify-between mb-7 apple-fade-in">
        <div>
          <div className="apple-pill mb-3">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--apple-success)" }} />
            Live · Invifescus · Omnilattice v2
          </div>
          <h1 className="apple-display" style={{ fontSize: 40, lineHeight: 1.05 }}>
            Your knowledge, choreographed.
          </h1>
          <p className="text-[15px] mt-2 max-w-2xl" style={{ color: "var(--apple-text-secondary)" }}>
            Live dashboard fed by your Feed Input, the Omnilattice graph, and the largest open-source
            visualization stack in the world. Four slides, one second brain.
          </p>
        </div>

        {data && (
          <div className="grid grid-cols-4 gap-3 apple-fade-in" style={{ minWidth: 480 }}>
            {[
              { label: "Concepts", value: data.totals.concepts, color: "#5b8dff" },
              { label: "Domains", value: data.totals.domains, color: "#30d158" },
              { label: "Bridges", value: data.totals.bridges, color: "#ff66c4" },
              { label: "Reflections", value: data.totals.reflections, color: "#ff9f0a" },
            ].map((s) => (
              <div key={s.label} className="apple-card px-4 py-3">
                <div className="text-[26px] font-semibold" style={{ color: s.color, letterSpacing: "-0.02em" }}>
                  {s.value}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: "var(--apple-text-tertiary)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      {err && (
        <div className="apple-card px-4 py-3 mb-4" style={{ color: "var(--apple-danger)" }}>
          Failed to load overview · {err}
        </div>
      )}

      {loading || !data ? (
        <div className="apple-card-strong rounded-[28px] h-[640px] apple-shimmer flex items-center justify-center" style={{ color: "var(--apple-text-secondary)" }}>
          Aggregating Omnilattice + Feed Input + open-source library…
        </div>
      ) : (
        <>
          <DashboardCarousel data={data} />

          <section className="grid grid-cols-3 gap-4 mt-6 apple-fade-in">
            <div className="apple-card px-5 py-5 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--apple-text-tertiary)" }}>
                    Largest Open-Source Library
                  </div>
                  <h3 className="apple-display text-[20px] mt-1">{data.sources.length} repos powering this dashboard</h3>
                </div>
                <div className="apple-pill">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--apple-accent)" }} />
                  open-source only
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {data.sources.map((s) => (
                  <div key={s.repo} className="flex items-center gap-3 text-[12px]">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: SOURCE_CATEGORY_COLOR[s.category] }}
                    />
                    <span style={{ color: "var(--apple-text)", fontWeight: 600, minWidth: 130 }}>{s.name}</span>
                    <span style={{ color: "var(--apple-text-secondary)", flex: 1 }}>{s.role}</span>
                    <span className="apple-pill" style={{ fontSize: 9, padding: "2px 8px" }}>
                      {SOURCE_CATEGORY_LABEL[s.category]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="apple-card px-5 py-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--apple-text-tertiary)" }}>
                    Agent Trail
                  </div>
                  <h3 className="apple-display text-[20px] mt-1">{data.totals.activeAgents} agents on duty</h3>
                </div>
                <div className="apple-pill">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--apple-success)" }} />
                  live
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {data.agentTrail.map((t, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <span style={{ color: "var(--apple-text)", fontWeight: 600 }}>
                        {t.agent.replace(" Agent", "")}
                      </span>
                      <span style={{ color: "var(--apple-text-tertiary)", fontSize: 10 }}>
                        {Math.round((Date.now() - t.ts) / 60000)}m ago
                      </span>
                    </div>
                    <span style={{ color: "var(--apple-text-secondary)", fontSize: 11 }}>{t.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-4 mt-4 apple-fade-in">
            <div className="apple-card px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: "var(--apple-text-tertiary)" }}>
                Feed Input
              </div>
              <div className="apple-display text-[28px]" style={{ color: "var(--apple-accent)" }}>
                {data.totals.feedItems}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--apple-text-secondary)" }}>
                items captured this week · text · voice · sketch · video
              </div>
            </div>
            <div className="apple-card px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: "var(--apple-text-tertiary)" }}>
                Open-Source Stack
              </div>
              <div className="apple-display text-[28px]" style={{ color: "#30d158" }}>
                {data.totals.openSourceRepos}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--apple-text-secondary)" }}>
                d3 · vega · deck.gl · maplibre · react-force-graph · mind-map · sjvisualizer · …
              </div>
            </div>
            <div className="apple-card px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: "var(--apple-text-tertiary)" }}>
                Pipeline
              </div>
              <div className="apple-display text-[16px]" style={{ color: "var(--apple-text)" }}>
                Feed → Brain → Synthesis → Slide
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--apple-text-secondary)" }}>
                Each slide consumes the same DashboardData payload — one fetch, four lenses.
              </div>
            </div>
          </section>

          <section className="apple-card px-5 py-4 mt-4 apple-fade-in">
            <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--apple-text-tertiary)" }}>
              Today's reflection
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="text-[13px]" style={{ color: "var(--apple-text)" }}>
                <span style={{ color: "var(--apple-accent)" }}>1. </span>
                You connected decomposition in CS to form breakdown in gymnastics. Where else in your
                week does breaking a complex thing into parts give you an advantage?
              </div>
              <div className="text-[13px]" style={{ color: "var(--apple-text)" }}>
                <span style={{ color: "var(--apple-accent)" }}>2. </span>
                You've mentioned the project deadline three times without naming what specifically
                worries you. What is the worst concrete outcome you're afraid of?
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
