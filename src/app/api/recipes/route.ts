import { auth } from "@clerk/nextjs/server";
import { getRecipesByFlavor, searchRecipes } from "@/lib/foodoscope";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const flavor = searchParams.get('flavor');
        const query = searchParams.get('query');
        const mood = searchParams.get('mood');
        const goals = searchParams.get('goals');

        if (!flavor && !query && !mood && !goals) {
            return NextResponse.json({ error: "Flavor, Query, Mood, or Goals required" }, { status: 400 });
        }

        const { userId } = await auth();

        // Get User Preferences from Clerk (Science Heart Guard)
        let isLowSalt = false;
        let goalList: string[] = goals ? goals.split(",") : [];

        if (userId) {
            try {
                const { clerkClient } = await import("@clerk/nextjs/server");
                const client = await clerkClient();
                const user = await client.users.getUser(userId);
                if (user.unsafeMetadata?.isLowSalt === true) {
                    isLowSalt = true;
                }
                // Merge goals from metadata if any
                const metaGoals = (user.unsafeMetadata?.goals as string[]) || [];
                goalList = Array.from(new Set([...goalList, ...metaGoals]));
            } catch (clerkError) {
                console.warn("[Clerk] Unable to fetch metadata:", clerkError);
            }
        }

        let recipes: any[] = [];
        let searchQuery = query || "";

        // PRIORITY LOGIC:
        // 1. Explicit Query (User typed something in Custom Search)
        // 2. Flavor (Specific molecular anchor)
        // 3. Mood (Vibe-based exploration)
        // 4. Goals (Healthy defaults)

        if (searchQuery) {
            console.log(`[API] Searching by Explicit Query: "${searchQuery}"`);
            recipes = await searchRecipes(searchQuery, goalList, isLowSalt);
        } else if (flavor) {
            console.log(`[API] Searching by Flavor: ${flavor}`);
            recipes = await getRecipesByFlavor(flavor, isLowSalt, goalList);
        } else if (mood && mood !== "neutral") {
            console.log(`[API] Searching by Mood: ${mood}`);
            recipes = await getRecipesByFlavor(mood, isLowSalt, goalList);
        } else if (goalList.length > 0) {
            console.log(`[API] Searching by Goals: ${goalList.join(", ")}`);
            recipes = await searchRecipes("", goalList, isLowSalt);
        }

        return NextResponse.json({ recipes });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
