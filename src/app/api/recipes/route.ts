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

        // Get User Preferences (Fail Safe)
        let isLowSalt = false;
        // Note: We need to sync Clerk users to Prisma to fetch preferences. 
        // For now, we will skip the preference check or implementation a webhook later.
        // if (userId) { ... }

        let recipes: any[] = [];
        let searchQuery = query || "";
        // If mood is present, we still use it as a base query if no other query exists? 
        // Actually, logic below handles mood separate.

        let goalList: string[] = [];
        if (goals) {
            goalList = goals.split(",");
        }

        if (mood) {
            // Prioritize Vibe/Mood Analysis
            console.log(`[API] Searching by Mood: ${mood}`);
            recipes = await getRecipesByFlavor(mood, isLowSalt);
        } else if (flavor) {
            console.log(`[API] Searching by Flavor: ${flavor}`);
            recipes = await getRecipesByFlavor(flavor, isLowSalt);
        } else {
            // Fallback to text search or goals
            console.log(`[API] Searching by Query: "${searchQuery}", Goals: ${goalList.length}`);
            recipes = await searchRecipes(searchQuery, goalList, isLowSalt);
        }

        return NextResponse.json({ recipes });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
