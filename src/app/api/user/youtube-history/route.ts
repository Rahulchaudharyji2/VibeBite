import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserHistory } from "@/lib/youtube";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the Google OAuth token from Clerk
        const client = await clerkClient();
        const response = await client.users.getUserOauthAccessToken(userId, "google");
        
        const token = response.data?.[0]?.token;

        if (!token) {
            console.error("[YouTube API] No OAuth token found for user:", userId);
            return NextResponse.json({ error: "No Google connection found" }, { status: 400 });
        }

        const history = await getUserHistory(token);
        
        if (!history) {
            return NextResponse.json({ error: "No history found" }, { status: 404 });
        }

        return NextResponse.json({ song: history });

    } catch (error: any) {
        console.error("[YouTube History API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
