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
        if (mood) searchQuery = searchQuery ? `${searchQuery} ${mood}` : mood;
        if (goals) {
            const goalList = goals.split(",");
            searchQuery = searchQuery ? `${searchQuery} ${goalList.join(" ")}` : goalList.join(" ");
        }

        if (searchQuery) {
            recipes = await searchRecipes(searchQuery, isLowSalt);
        } else if (flavor) {
            recipes = await getRecipesByFlavor(flavor, isLowSalt);
        }

        return NextResponse.json({ recipes });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
