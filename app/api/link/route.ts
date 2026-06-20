import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/ai";
import { getEmbedding } from "@/lib/embeddings";
import { findSimilar, createBridge } from "@/lib/neo4j";
import { LINKER_PROMPT } from "@/lib/prompts";

interface BridgeResult {
  bridges: Array<{
    targetId: string;
    explanation: string;
    strength: number;
    sharedPattern: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conceptId, conceptName, domain } = body as {
      conceptId: string;
      conceptName: string;
      domain: string;
    };

    // Get embedding for the source concept
    const embedding = await getEmbedding(conceptName);

    // Find similar concepts in OTHER domains
    const candidates = await findSimilar(embedding, domain, 5);

    if (candidates.length === 0) {
      return NextResponse.json({
        conceptId,
        bridges: [],
        message: "No cross-domain candidates found yet. Add more concepts from different domains.",
      });
    }

    const candidateDescription = candidates
      .map((c) => `- "${c.name}" (id: ${c.id}, domain: ${c.domain}, similarity: ${c.score.toFixed(2)})`)
      .join("\n");

    // Ask LLM to evaluate structural connections
    const result = await chatJSON<BridgeResult>(
      LINKER_PROMPT,
      `Source concept: "${conceptName}" (domain: ${domain})

Candidate concepts from other domains:
${candidateDescription}`
    );

    // Save valid bridges to Neo4j
    for (const bridge of result.bridges) {
      if (bridge.strength >= 0.5) {
        await createBridge(
          conceptId,
          bridge.targetId,
          bridge.explanation,
          bridge.strength
        );
      }
    }

    return NextResponse.json({
      conceptId,
      bridgesFound: result.bridges.length,
      bridges: result.bridges,
    });
  } catch (error) {
    console.error("Link error:", error);
    return NextResponse.json(
      { error: "Failed to find cross-domain links", details: String(error) },
      { status: 500 }
    );
  }
}
