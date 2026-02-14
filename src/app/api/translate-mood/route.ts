import { NextResponse } from "next/server";

// You will need to add GEMINI_API_KEY to your .env.local file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mood } = body;

        if (!mood) {
            return NextResponse.json({ error: "Mood is required" }, { status: 400 });
        }

        // If no API key is set yet, gracefully fall back to a basic string return
        // so VibeBite doesn't crash during local testing without env vars.
        if (!GEMINI_API_KEY) {
            console.warn("[AI Bridge] No GEMINI_API_KEY found. Using fallback.");
            return NextResponse.json({ ingredient: "mint" });
        }

        // The strict system prompt to force a single-word ingredient response
        const prompt = `You are a culinary science AI. The user will give you a mood or emotion. 
    You must reply with exactly ONE word: a raw food ingredient that represents that mood chemically or culturally. 
    For example: 
    - if the mood is 'happy', reply 'vanilla'
    - if the mood is 'sad', reply 'chocolate'
    - if the mood is 'stressed', reply 'chamomile'
    - if the mood is 'energetic', reply 'lemon'
    
    Do not include punctuation, markdown, or explanations.
    Mood: ${mood}`;

        // Lightweight direct fetch to the Gemini 2.5 Flash model
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2, // Low temperature ensures highly deterministic, reliable outputs
                    maxOutputTokens: 10,
                }
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.warn("[AI Bridge] Gemini Rate Limit Exceeded (429). Using smart fallback.");

                const fallbackMap: Record<string, string> = {
                    "comfort food": "potato",
                    "happy": "vanilla",
                    "sad": "chocolate",
                    "energetic": "lemon",
                    "relaxed": "chamomile",
                    "stressed": "mint",
                    "romantic": "strawberry",
                    "party": "cheese",
                    "focused": "coffee"
                };

                const key = mood.toLowerCase().trim();
                const fallbackIngredient = fallbackMap[key] || fallbackMap[key.split(" ")[0]] || "mint";

                return NextResponse.json({ ingredient: fallbackIngredient });
            }
            throw new Error(`Google API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Extract the text block from the Gemini payload
        let ingredient = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "mint";

        // Defensive sanitization: remove any stray punctuation or line breaks the AI might have sneaked in
        ingredient = ingredient.replace(/[^a-zA-Z\s]/g, "").toLowerCase().trim();

        return NextResponse.json({ ingredient });

    } catch (error) {
        console.error("[AI Bridge] Translation Error:", error);
        // Ultimate fallback: if the network drops or API quota is hit, return a safe default
        // so the FlavorDB search still has a valid string to work with.
        return NextResponse.json({ ingredient: "mint" });
    }
}