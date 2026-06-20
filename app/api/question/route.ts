import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/ai";
import { QUESTION_PROMPT } from "@/lib/prompts";

interface QuestionResult {
  questions: string[];
  forcingAction: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conceptName, domain, userDomains, recentConcepts } = body as {
      conceptName: string;
      domain: string;
      userDomains?: string[];       // all domains the user has content in
      recentConcepts?: string[];    // recently logged concepts for repetition detection
    };

    // Check for repetition pattern (overthinking detection)
    const repetitionWarning = recentConcepts
      ? detectRepetition(recentConcepts)
      : null;

    const domainsContext = userDomains?.length
      ? `The user has content in these domains: ${userDomains.join(", ")}`
      : "The user is just starting — no other domains yet.";

    const repetitionContext = repetitionWarning
      ? `\n\nWARNING: ${repetitionWarning}`
      : "";

    const result = await chatJSON<QuestionResult>(
      QUESTION_PROMPT,
      `Concept just logged: "${conceptName}" (domain: ${domain})

${domainsContext}${repetitionContext}`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Question error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions", details: String(error) },
      { status: 500 }
    );
  }
}

// Detect if the user keeps logging the same worry
function detectRepetition(recentConcepts: string[]): string | null {
  const normalized = recentConcepts.map((c) => c.toLowerCase().trim());
  const counts = new Map<string, number>();

  for (const concept of normalized) {
    // Simple word overlap check
    for (const other of normalized) {
      if (concept === other) continue;
      const words1 = new Set(concept.split(/\s+/));
      const words2 = new Set(other.split(/\s+/));
      const overlap = [...words1].filter((w) => words2.has(w)).length;
      const ratio = overlap / Math.min(words1.size, words2.size);
      if (ratio > 0.6) {
        counts.set(concept, (counts.get(concept) || 1) + 1);
      }
    }
  }

  for (const [concept, count] of counts) {
    if (count >= 3) {
      return `The user has mentioned "${concept}" or very similar topics ${count} times recently without reaching a resolution. This is a rumination pattern — address it directly.`;
    }
  }

  return null;
}
