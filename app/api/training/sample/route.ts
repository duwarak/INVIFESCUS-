import { NextRequest, NextResponse } from "next/server";
import { loadScenarios, trainingStats, pickScenario } from "../../../../lib/training/loader";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const stats = trainingStats();
  if (id) {
    const s = loadScenarios().find((x) => x.id === id) ?? pickScenario(id.length);
    return NextResponse.json({ stats, scenario: s });
  }
  return NextResponse.json({
    stats,
    scenarios: loadScenarios().slice(0, 10).map((s) => ({
      id: s.id, title: s.title, user: s.user,
      domains: s.domains_triggered,
      pattern: s.ai_synthesis.detected_pattern,
      angles: s.ai_synthesis.cross_domain_solutions.length,
    })),
  });
}
