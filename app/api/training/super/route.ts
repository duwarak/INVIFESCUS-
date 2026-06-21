import { NextRequest, NextResponse } from "next/server";
import { loadSuperScenarios, pickSuperScenario, trainingStats } from "../../../../lib/training/loader";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const seed = url.searchParams.get("seed");
  if (id) {
    const found = loadSuperScenarios().find((s) => s.id === id);
    if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(found);
  }
  if (seed) {
    return NextResponse.json(pickSuperScenario(Number(seed) || seed.length));
  }
  return NextResponse.json({
    stats: trainingStats(),
    scenarios: loadSuperScenarios(),
  });
}
