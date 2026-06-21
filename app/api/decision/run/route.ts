import { NextRequest, NextResponse } from "next/server";
import { runDecision } from "../../../../lib/decision/runner";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { question?: string };
  const q = (body?.question ?? "").trim();
  if (!q) return NextResponse.json({ error: "missing question" }, { status: 400 });
  return NextResponse.json(runDecision(q));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "Should I skip gym for the project?";
  return NextResponse.json(runDecision(q));
}
