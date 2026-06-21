import { NextRequest, NextResponse } from "next/server";
import {
  loadProfiles, loadPosts, loadRequests, loadMessages, loadMyProfile, safetyFor,
} from "../../../../lib/community/social";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const view = url.searchParams.get("view") ?? "all";
  const me = loadMyProfile();
  const safety = safetyFor(me);
  const profiles = loadProfiles().filter((p) => p.visibility !== "guardian_only" || me.trustLevel === "moderator");

  if (view === "network") {
    return NextResponse.json({
      me,
      safety,
      suggestions: profiles.slice(0, 8),
      followers: profiles.slice(8, 14),
      following: profiles.slice(2, 7),
    });
  }
  if (view === "feed") {
    return NextResponse.json({ me, safety, posts: loadPosts().slice(0, 20) });
  }
  if (view === "questions") {
    return NextResponse.json({ me, safety, posts: loadPosts().filter((p) => p.type === "question").slice(0, 12) });
  }
  if (view === "profile") {
    return NextResponse.json({ me, safety });
  }
  if (view === "messages") {
    return NextResponse.json({ me, safety, threads: loadMessages(me.id), requests: loadRequests(me.id) });
  }
  return NextResponse.json({
    me, safety,
    counts: {
      profiles: profiles.length,
      posts: loadPosts().length,
      requests: loadRequests(me.id).length,
      threads: loadMessages(me.id).length,
    },
  });
}
