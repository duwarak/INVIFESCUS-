import { NextRequest, NextResponse } from "next/server";
import { SKILLS, pickSkills } from "../../../../lib/power-brain/skills";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (q) {
    return NextResponse.json({ skills: pickSkills(q), totalAvailable: SKILLS.length });
  }
  return NextResponse.json({
    skills: SKILLS.map((s) => ({
      name: s.name,
      description: s.description,
      triggers: s.triggers,
    })),
    totalAvailable: SKILLS.length,
  });
}
