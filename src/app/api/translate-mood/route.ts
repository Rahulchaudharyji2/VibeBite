import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// You will need to add GEMINI_API_KEY to your .env.local file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mood } = body;

        if (!mood) {
            return NextResponse.json({ error: "Mood is required" }, { status: 400 });
        }

        // 1. LOAD CUSTOM RULES (RAG KNOWLEDGE)
        let rulesContext = "";
        try {
            const rulesPath = path.join(process.cwd(), "src/data/custom-rules.json");
            const fileData = fs.readFileSync(rulesPath, "utf-8");
            const rules = JSON.parse(fileData);
            rulesContext = JSON.stringify(rules.mood_rules);
        } catch (err) {
            console.warn("[AI Bridge] Failed to load custom-rules.json for RAG context.");
        }

        // If no API key is set yet, gracefully fall back
        if (!GEMINI_API_KEY) {
            console.warn("[AI Bridge] No GEMINI_API_KEY found. Using fallback.");
            return NextResponse.json({ 
                ingredients: ["mint"], 
                reason: "Using generic fallback due to missing configuration.",
                ingredient: "mint"
            });
        }

        // 2. CONSTRUCT RAG PROMPT
        const prompt = `You are a culinary science AI for the VibeBite app. 
        The user has provided a mood: "${mood}".
        
        ### Scientific Context (Curated Rules):
        ${rulesContext}
        
        ### Instructions:
        1. Contextual Analysis: Look for the mood in the curated rules above.
        2. Scientific Reasoning: Explain WHY specific ingredients represent this mood chemically (e.g., "Theobromine in chocolate triggers dopamine") or culturally.
        3. Dynamic Suggestions: If not in rules, suggest 2-3 raw food ingredients based on cross-modal correspondence.
        4. Response Format: You MUST reply with a valid JSON object only. No preamble.
        
        Expected JSON Schema:
        {
          "ingredients": ["ingredient1", "ingredient2"],
          "reason": "Short 1-sentence scientific or cultural explanation."
        }
        
        Mood: ${mood}`;

        // Lightweight direct fetch to the Gemini 2.5 Flash model
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2, 
                    maxOutputTokens: 250,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.warn("[AI Bridge] Gemini Rate Limit Exceeded (429). Using smart fallback.");
                return NextResponse.json({ 
                    ingredients: ["mint", "chamomile"],
                    reason: "Using calming herbal extracts to manage system throughput.",
                    ingredient: "mint, chamomile"
                });
            }
            throw new Error(`Google API responded with status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
        
        try {
            const parsed = JSON.parse(aiResponseText);
            console.log(`[AI Bridge] RAG Analysis for '${mood}':`, parsed);
            return NextResponse.json({
                ingredients: parsed.ingredients || ["mint"],
                reason: parsed.reason || "Matched via sensory alignment patterns.",
                ingredient: (parsed.ingredients || ["mint"]).join(", ")
            });
        } catch (e) {
            console.error("[AI Bridge] Parse Error:", aiResponseText);
            return NextResponse.json({ 
                ingredients: ["mint"], 
                reason: "Standardized herbal profile for baseline synchronization.",
                ingredient: "mint"
            });
        }

    } catch (error) {
        console.error("[AI Bridge] Error:", error);
        return NextResponse.json({ 
            ingredients: ["mint"], 
            reason: "Safe baseline ingredients due to connection instability.",
            ingredient: "mint"
        });
    }
}