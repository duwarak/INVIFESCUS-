import { NextRequest, NextResponse } from "next/server";
import {
  loadGenealogySlice,
  loadLiveSlice,
  loadMemorySlice,
} from "../../../../lib/power-brain/dataset";
import { computeInsights } from "../../../../lib/power-brain/insights";

function pickGraph(scope: string | null) {
  if (scope === "memory") return loadMemorySlice();
  if (scope === "genealogy") return loadGenealogySlice();
  return loadLiveSlice();
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const scope = url.searchParams.get("scope");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const graph = pickGraph(scope);
  const insights = computeInsights(graph, id);
  if (!insights) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(insights);
}
