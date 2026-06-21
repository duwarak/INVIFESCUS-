import { NextResponse } from "next/server";
import { buildDashboardData } from "../../../../lib/dashboard/aggregate";

export async function GET() {
  return NextResponse.json(buildDashboardData());
}
