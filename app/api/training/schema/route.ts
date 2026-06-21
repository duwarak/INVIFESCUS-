import { NextRequest, NextResponse } from "next/server";
import { loadSchemaDataset, trainingStats } from "../../../../lib/training/loader";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const ds = loadSchemaDataset();
  if (entity && (ds.data as any)[entity]) {
    return NextResponse.json({
      entity,
      total: (ds.data as any)[entity].length,
      items: (ds.data as any)[entity].slice(0, limit),
    });
  }
  return NextResponse.json({
    metadata: ds.metadata,
    stats: trainingStats(),
    sample: {
      input: ds.data.input_items.slice(0, 3),
      concept: ds.data.concept_extractions.slice(0, 3),
      task: ds.data.priority_tasks.slice(0, 3),
      reflection: ds.data.reflection_prompts.slice(0, 3),
      outcome: ds.data.outcome_records.slice(0, 3),
      community: ds.data.community_records.slice(0, 3),
      transfer: ds.data.transfer_links.slice(0, 3),
    },
  });
}
