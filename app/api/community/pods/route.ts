import { NextResponse } from "next/server";
import { buildMockPods, buildMockRegions } from "../../../../lib/community/mock-pods";

export async function GET() {
  const pods = buildMockPods();
  const regions = buildMockRegions();
  return NextResponse.json({
    pods,
    regions,
    totals: {
      pods: pods.length,
      members: pods.reduce((s, p) => s + p.memberCount, 0),
      domains: Array.from(new Set(pods.flatMap((p) => p.domains))).length,
      flagged: pods.filter((p) => p.moderation.status === "flagged").length,
      pendingReview: pods.filter((p) => p.moderation.status === "pending_review").length,
    },
    agents: [
      "agent_community  · matchmaking",
      "agent_moderation · modcandy pattern",
      "agent_geomap     · GeoNode + MapLibre",
    ],
  });
}
