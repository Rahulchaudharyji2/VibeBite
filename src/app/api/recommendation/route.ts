import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserHistory } from "@/lib/youtube";
import { getRecipesByFlavor } from "@/lib/foodoscope";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch YouTube History for Personalized Context
        const client = await clerkClient();
        const oauthResponse = await client.users.getUserOauthAccessToken(userId, "google");
        const token = oauthResponse.data?.[0]?.token;

        let historyTrack = null;
        if (token) {
            historyTrack = await getUserHistory(token);
        }

        // 2. Fetch User Health Preferences from Clerk (Science Heart Guard)
        const user = await client.users.getUser(userId);
        const isLowSalt = user.unsafeMetadata?.isLowSalt === true;
        const goals = (user.unsafeMetadata?.goals as string[]) || [];

        // 3. Combine Context for Deep Analysis
        // If no history, we use a default high-vibe query
        const baseVibe = historyTrack 
            ? `${historyTrack.title} by ${historyTrack.artist}` 
            : "Energetic and Healthy";

        console.log(`[Recommendation API] Generating Deep Recommendation for: ${baseVibe}`);

        // 4. Perform Deep Search using the enhanced engine
        // The getRecipesByFlavor will call our RAG-enabled translate-mood
        const recipes = await getRecipesByFlavor(baseVibe, isLowSalt, goals);

        return NextResponse.json({
            personalization: {
                source: historyTrack ? "YouTube History" : "Discovery Mode",
                context: baseVibe,
                healthGuard: isLowSalt ? "Low Sodium Active" : "Standard"
            },
            recipes
        });

    } catch (error: any) {
        console.error("[Recommendation API] Error:", error);
        return NextResponse.json({ error: "Failed to generate recommendation" }, { status: 500 });
    }
}
