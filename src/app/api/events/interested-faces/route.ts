import { NextRequest, NextResponse } from "next/server";
import { getCachedInterestCount, getCachedInterestedAvatars } from "@/lib/events/interestedAvatars";

const MAX_EVENTS_PER_REQUEST = 24;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Usernames only: a card draws its face from the username, so nothing else needs to leave the server.
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") || "").split(",");
  if (ids.length > MAX_EVENTS_PER_REQUEST || !ids.every((id) => UUID_PATTERN.test(id))) {
    return NextResponse.json({ error: "Invalid event ids" }, { status: 400 });
  }

  const entries = await Promise.all(
    ids.map(async (id) => {
      const [avatars, count] = await Promise.all([getCachedInterestedAvatars(id), getCachedInterestCount(id)]);
      // Kept even when null: someone with no username yet still counts and gets a default face.
      return [id, { count, faces: avatars.map((avatar) => avatar.username) }] as const;
    })
  );

  // No edge cache: someone who just tapped must see it on return. The server cache above guards the database.
  return NextResponse.json(Object.fromEntries(entries), { headers: { "Cache-Control": "no-store" } });
}
