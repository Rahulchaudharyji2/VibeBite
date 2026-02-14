import { auth } from "@clerk/nextjs/server";
import { getNowPlaying } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  // Even for mock, we generally want an authenticated user context, 
  // but since Spotify API is "on hold", we can skip the strict accessToken check for now
  // or just check for session existence.
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use Real Data
  const nowPlaying = await getNowPlaying();

  if (!nowPlaying) {
    return NextResponse.json({ error: "No track found or API error" }, { status: 500 });
  }

  // Use real features
  const { valence, energy } = nowPlaying;
  let mood = "chill";

  if (energy > 0.7 && valence > 0.7) mood = "happy";
  else if (energy > 0.7 && valence < 0.4) mood = "stressed"; // High energy, negative emotion
  else if (energy < 0.4 && valence < 0.4) mood = "sad";
  else if (energy > 0.8) mood = "energetic";
  else mood = "chill";

  // Map to FlavorDB Profile (Mocked for now)
  const flavorMap: Record<string, string> = {
    happy: "Sweet",
    stressed: "Spicy",
    sad: "Savory",
    energetic: "Sour",
    chill: "Bitter"
  };

  return NextResponse.json({
    mood,
    flavor: flavorMap[mood],
    track: nowPlaying
  });
}
