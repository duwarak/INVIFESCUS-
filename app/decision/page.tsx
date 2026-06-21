"use client";

import { useState } from "react";
import CriticReport from "@/components/critic-report";
import DecisionChart from "@/components/decision-chart";

interface CriticData {
  flaws: string[];
  hiddenAssumptions: string[];
  alternatives: string[];
  premortem: string;
}

interface Branch {
  horizon: string;
  name: string;
  outcomes: string[];
  confidence: number;
  narrative: string;
}

interface ScenarioData {
  branches: Branch[];
  recommendation: string;
}

export default function DecisionPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [criticData, setCriticData] = useState<CriticData | null>(null);
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setCriticData(null);
    setScenarioData(null);

    try {
      // Run CriticAgent and ScenarioAgent in parallel
      const [criticRes, scenarioRes] = await Promise.all([
        fetch("/api/critic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decisionText: question }),
        }),
        fetch("/api/scenario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decisionText: question }),
        }),
      ]);

      if (criticRes.ok) setCriticData(await criticRes.json());
      if (scenarioRes.ok) setScenarioData(await scenarioRes.json());
    } catch (err) {
      console.error("Decision analysis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Empiricum</h2>
        <p className="text-sm text-polymath-muted mt-1">
          Type a decision you&apos;re wrestling with. The CriticAgent attacks it from four perspectives, while the ScenarioAgent simulates three futures using your life-variable graph.
        </p>
      </div>

      {/* Input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Should I skip gym for the project?"
          className="flex-1 bg-polymath-surface border border-polymath-border rounded-lg px-4 py-3 text-polymath-text placeholder:text-polymath-muted/50 focus:outline-none focus:border-polymath-accent"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !question.trim()}
          className="px-6 py-3 bg-polymath-accent text-white rounded-lg font-medium hover:bg-polymath-accent-light disabled:opacity-40 transition-all shrink-0"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 text-polymath-muted">
          <p className="text-sm">Running 4 persona prompts + causal graph simulation...</p>
          <p className="text-xs mt-1 opacity-60">CriticAgent and ScenarioAgent are working in parallel</p>
        </div>
      )}

      {/* Results */}
      {(criticData || scenarioData) && (
        <div className="space-y-6">
          {/* Question label */}
          <div className="bg-polymath-surface border border-polymath-border rounded-lg p-4">
            <p className="text-xs text-polymath-muted mb-1">Your question</p>
            <p className="text-polymath-text font-medium">{question}</p>
          </div>

          {/* Critic report */}
          {criticData && (
            <div>
              <h3 className="text-sm font-medium text-polymath-muted mb-3">
                CriticAgent — what could go wrong
              </h3>
              <CriticReport data={criticData} />
            </div>
          )}

          {/* Scenario branches */}
          {scenarioData && (
            <div>
              <h3 className="text-sm font-medium text-polymath-muted mb-3">
                ScenarioAgent — Decision Weather Report
              </h3>
              <DecisionChart branches={scenarioData.branches} />

              {/* Recommendation */}
              <div className="mt-4 bg-polymath-surface border border-polymath-teal/20 rounded-lg p-4">
                <p className="text-sm text-polymath-teal font-medium mb-1">Recommendation</p>
                <p className="text-sm text-polymath-text">{scenarioData.recommendation}</p>
                <p className="text-xs text-polymath-muted mt-2">
                  This is a nudge, not a command. You always decide.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
