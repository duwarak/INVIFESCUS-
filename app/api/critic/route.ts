import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/ai";
import { CRITIC_PROMPT } from "@/lib/prompts";

interface CriticResult {
  flaws: string[];
  hiddenAssumptions: string[];
  alternatives: string[];
  premortem: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { decisionText, context } = body as {
      decisionText: string;
      context?: string; // optional additional context about the user's situation
    };

    const userMessage = context
      ? `Decision: "${decisionText}"\n\nAdditional context: ${context}`
      : `Decision: "${decisionText}"`;

    const result = await chatJSON<CriticResult>(
      CRITIC_PROMPT,
      userMessage
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Critic error:", error);
    return NextResponse.json(
      { error: "Failed to generate critique", details: String(error) },
      { status: 500 }
    );
  }
}
