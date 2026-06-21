import { NextResponse } from "next/server";
import { snapshotAgents, agentsByLayer } from "../../../../lib/agents/registry";

export async function GET() {
  const all = snapshotAgents();
  const byLayer = agentsByLayer();
  return NextResponse.json({
    agents: all,
    byLayer,
    totals: {
      total: all.length,
      running: all.filter((a) => a.status === "running").length,
      idle: all.filter((a) => a.status === "idle").length,
      warning: all.filter((a) => a.status === "warning").length,
      layers: byLayer.length,
    },
    storage: {
      backend: "MemPalace",
      wings: Array.from(new Set(all.map((a) => a.storesIn.split("·")[0].trim()))),
      cacheFile: ".brain-cache/memory-extensions.json",
    },
  });
}
