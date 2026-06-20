import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/ai";
import { propagate, narrativeSummary, DEFAULT_NODES } from "@/lib/causal-graph";
import { SCENARIO_PROMPT } from "@/lib/prompts";

interface ScenarioResult {
  branches: Array<{
    horizon: string;
    name: string;
    outcomes: string[];
    confidence: number;
    narrative: string;
  }>;
  recommendation: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { decisionText, affectedVariable, delta } = body as {
      decisionText: string;
      affectedVariable?: string; // which causal node is most affected
      delta?: number;            // how much it changes (-100 to +100)
    };

    // Determine the primary causal variable from the decision
    const variable = affectedVariable || inferVariable(decisionText);
    const change = delta || inferDelta(decisionText);

    // Run causal graph propagation
    const propagationResults = propagate(variable, change, 2);
    const summary = narrativeSummary(variable, change, propagationResults);

    // Format propagation for LLM context
    const propagationContext = propagationResults
      .map((r) => `${r.label}: ${r.delta > 0 ? "+" : ""}${r.delta.toFixed(1)} (${r.explanation})`)
      .join("\n");

    const result = await chatJSON<ScenarioResult>(
      SCENARIO_PROMPT,
      `Decision: "${decisionText}"

Causal graph propagation results:
Primary variable changed: ${variable} by ${change > 0 ? "+" : ""}${change}
${propagationContext}

Summary: ${summary}`
    );

    return NextResponse.json({
      ...result,
      causalData: {
        variable,
        delta: change,
        propagation: propagationResults,
      },
    });
  } catch (error) {
    console.error("Scenario error:", error);
    return NextResponse.json(
      { error: "Failed to generate scenario", details: String(error) },
      { status: 500 }
    );
  }
}

// Infer which causal variable a decision affects most
function inferVariable(decision: string): string {
  const lower = decision.toLowerCase();
  const keywords: Record<string, string[]> = {
    gym: ["gym", "exercise", "workout", "run", "sport", "physical"],
    sleep: ["sleep", "rest", "nap", "bed", "tired"],
    project_time: ["project", "code", "build", "work", "assignment", "deadline"],
    social: ["friend", "social", "meet", "talk", "hang out", "party"],
    academics: ["study", "class", "exam", "lecture", "homework", "grade"],
    skill_decay: ["practice", "music", "instrument", "violin", "gymnastics", "skill"],
  };

  for (const [variable, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) return variable;
  }

  return "stress"; // default fallback
}

// Infer direction and magnitude of change
function inferDelta(decision: string): number {
  const lower = decision.toLowerCase();
  const skipWords = ["skip", "stop", "quit", "drop", "cancel", "miss", "avoid"];
  const boostWords = ["more", "extra", "double", "focus", "prioritize", "increase"];

  if (skipWords.some((w) => lower.includes(w))) return -30;
  if (boostWords.some((w) => lower.includes(w))) return 25;
  return -20; // default: decisions usually involve trade-offs
}
