import { NextRequest, NextResponse } from "next/server";
import { loadSchemaDataset } from "../../../../lib/training/loader";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") ?? 10)));

  const ds = loadSchemaDataset();
  const inputs = ds.data.input_items;
  const concepts = ds.data.concept_extractions;
  const conceptByInput = new Map(concepts.map((c) => [c.input_id, c]));

  const rows = [...inputs]
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, limit)
    .map((it) => {
      const c = conceptByInput.get(it.input_id);
      return {
        inputId: it.input_id,
        type: it.type,
        content: it.content,
        sourceContext: it.source_context,
        timestamp: it.timestamp,
        emotion: it.emotion_signal,
        stickiness: it.stickiness_score,
        concept: c ? { topic: c.topic, subtopic: c.subtopic, domain: c.domain, tags: c.tags, confidence: c.confidence } : null,
      };
    });

  return NextResponse.json({
    items: rows,
    total: inputs.length,
    source: "training-schema-dataset · 100 input_items",
  });
}
