import { NextRequest, NextResponse } from "next/server";
import { runTiny } from "../../../../lib/llm/tiny";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { prompt?: string; temperature?: number };
  return NextResponse.json(runTiny(body?.prompt ?? "", { temperature: body?.temperature }));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const p = url.searchParams.get("p") ?? "Should I commit to the next quarter?";
  return NextResponse.json(runTiny(p));
}
