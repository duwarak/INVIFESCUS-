"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Branch {
  horizon: string;
  name: string;
  outcomes: string[];
  confidence: number;
  narrative: string;
}

interface DecisionChartProps {
  branches: Branch[];
}

const HORIZON_COLORS = ["#2dd4bf", "#7c5cfc", "#fb7185"];

export default function DecisionChart({ branches }: DecisionChartProps) {
  const chartData = branches.map((b, i) => ({
    horizon: b.horizon,
    confidence: Math.round(b.confidence * 100),
    fill: HORIZON_COLORS[i] || "#6b7280",
  }));

  return (
    <div className="space-y-6">
      {/* Confidence bar chart */}
      <div className="bg-polymath-surface border border-polymath-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-polymath-muted mb-3">
          Confidence by time horizon
        </h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#8888a0", fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="horizon"
              width={80}
              tick={{ fill: "#e2e2e8", fontSize: 13 }}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a24",
                border: "1px solid #2a2a3a",
                borderRadius: "8px",
                color: "#e2e2e8",
              }}
              formatter={(value: number) => [`${value}%`, "Confidence"]}
            />
            <Bar dataKey="confidence" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Branch cards */}
      {branches.map((branch, i) => (
        <div
          key={i}
          className="bg-polymath-surface border border-polymath-border rounded-lg p-4"
          style={{ borderLeftColor: HORIZON_COLORS[i], borderLeftWidth: 3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-polymath-text">{branch.name}</h3>
            <span
              className="text-sm font-medium px-2 py-0.5 rounded"
              style={{
                color: HORIZON_COLORS[i],
                background: `${HORIZON_COLORS[i]}15`,
              }}
            >
              {branch.horizon} — {Math.round(branch.confidence * 100)}%
            </span>
          </div>
          <p className="text-sm text-polymath-muted mb-3">{branch.narrative}</p>
          <ul className="space-y-1">
            {branch.outcomes.map((outcome, j) => (
              <li key={j} className="text-sm text-polymath-text flex items-start gap-2">
                <span className="text-polymath-muted mt-0.5">→</span>
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
