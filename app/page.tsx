"use client";

import dynamic from "next/dynamic";

const MindMap = dynamic(() => import("@/components/mindmap"), { ssr: false });

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Your knowledge map</h2>
        <p className="text-sm text-polymath-muted mt-1">
          Every concept you've fed in, connected across domains. Animated edges are cross-domain bridges the AI discovered.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Concepts", value: "23", color: "text-polymath-accent" },
          { label: "Domains", value: "5", color: "text-polymath-teal" },
          { label: "Bridges", value: "8", color: "text-polymath-coral" },
          { label: "Reflections", value: "14", color: "text-polymath-amber" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-polymath-surface border border-polymath-border rounded-lg p-3"
          >
            <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-polymath-muted mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mind map */}
      <div className="flex-1 min-h-[500px] bg-polymath-surface border border-polymath-border rounded-lg overflow-hidden">
        <MindMap />
      </div>

      {/* Today's reflection questions */}
      <div className="mt-4 bg-polymath-surface border border-polymath-accent/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-polymath-accent mb-3">
          Today&apos;s reflection
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-polymath-accent mt-0.5">1.</span>
            <p className="text-sm text-polymath-text">
              You connected decomposition in CS to form breakdown in gymnastics. Where else in your week does breaking a complex thing into parts give you an advantage?
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-polymath-accent mt-0.5">2.</span>
            <p className="text-sm text-polymath-text">
              You&apos;ve mentioned the project deadline three times without naming what specifically worries you. What is the worst concrete outcome you&apos;re afraid of?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
