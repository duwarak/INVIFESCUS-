import { NextRequest, NextResponse } from "next/server";
import { chatJSON, chatWithImage } from "@/lib/ai";
import { getEmbedding } from "@/lib/embeddings";
import { saveConcept } from "@/lib/neo4j";
import { INGEST_PROMPT, INGEST_IMAGE_PROMPT } from "@/lib/prompts";
import { v4 as uuidv4 } from "uuid";

interface IngestResult {
  concept: string;
  domain: string;
  type: string;
  relatedTerms: string[];
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content } = body as {
      type: "text" | "image" | "docx" | "audio";
      content: string; // text content or base64 for image/audio
    };

    let extracted: IngestResult;

    if (type === "image") {
      // Use llava for image understanding
      const raw = await chatWithImage(
        INGEST_IMAGE_PROMPT,
        "Extract the core concept from this image.",
        content
      );
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      extracted = JSON.parse(cleaned);
    } else {
      // Text, docx (pre-parsed), or transcribed audio
      extracted = await chatJSON<IngestResult>(
        INGEST_PROMPT,
        content
      );
    }

    // Generate embedding for vector search
    const embedding = await getEmbedding(
      `${extracted.concept} ${extracted.relatedTerms.join(" ")}`
    );

    // Save to Neo4j
    const id = uuidv4();
    await saveConcept({
      id,
      name: extracted.concept,
      domain: extracted.domain,
      type: extracted.type,
      relatedTerms: extracted.relatedTerms,
      confidence: extracted.confidence,
      rawInput: type === "image" ? "[image]" : content.substring(0, 500),
      embedding,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id,
      ...extracted,
      saved: true,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Failed to ingest content", details: String(error) },
      { status: 500 }
    );
  }
}
