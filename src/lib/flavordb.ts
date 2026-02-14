const FLAVORDB_API_KEY = process.env.FOODOSCOPE_API_KEY || "";
const FLAVORDB_BASE_URL = "http://cosylab.iiitd.edu.in:6969/flavordb";

/**
 * Step 1: The AI Translation Bridge
 * Dynamically translates an abstract mood ("chill") into a concrete ingredient ("chamomile").
 * This eliminates the need for hardcoded dictionaries.
 */
async function translateMoodToIngredient(mood: string): Promise<string> {
    try {
        // You will need to create a simple Next.js API route (/api/translate-mood) 
        // that prompts an LLM: "Reply with ONLY a single raw food ingredient that represents the mood '{mood}'."
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/translate-mood`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mood })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[AI Bridge] Translated mood '${mood}' -> ingredient '${data.ingredient}'`);
            return data.ingredient.toLowerCase();
        }
    } catch (error) {
        console.error("[AI Bridge] Translation failed:", error);
    }
    
    // Absolute fallback if your AI translation route is down, 
    // ensuring the app doesn't crash.
    return mood.toLowerCase(); 
}

/**
 * Step 2: The Live FlavorDB Fetch
 * Takes the dynamically generated ingredient and fetches its molecular pairings.
 */
export async function getMolecularPairings(flavorOrMood: string): Promise<string[]> {
    // 1. Get the dynamic ingredient translation
    const apiQueryIngredient = await translateMoodToIngredient(flavorOrMood);

    // 2. Fetch exclusively from the Live FlavorDB API
    try {
        const url = `${FLAVORDB_BASE_URL}/food/by-alias?food_pair=${encodeURIComponent(apiQueryIngredient)}`;
        console.log(`[FlavorDB] Fetching live pairings for API query: ${apiQueryIngredient}`);

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${FLAVORDB_API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            next: { revalidate: 3600 } 
        });

        if (!res.ok) {
            console.error(`[FlavorDB] Live API Error: ${res.status}`);
            return [apiQueryIngredient]; 
        }

        const data = await res.json();
        let parsedIngredients: string[] = [];

        // 🚨 THE FIX: Parse the exact structure revealed by our debug script
        if (data && Array.isArray(data.topSimilarEntities)) {
            // Map over the array and extract the 'entityName' string
            parsedIngredients = data.topSimilarEntities.map((item: any) => item.entityName);
        } else if (Array.isArray(data)) {
            // Safe fallback just in case their API shape changes later
            parsedIngredients = data.map((item: any) => item.entityName || typeof item === 'string' ? item : null);
        }

        // Clean up the array (remove undefined/nulls and empty strings)
        parsedIngredients = parsedIngredients.filter(i => typeof i === 'string' && i.length > 0);

        if (parsedIngredients.length > 0) {
            console.log(`[FlavorDB] Matches Found: ${parsedIngredients.slice(0, 5).join(", ")}...`);
            return parsedIngredients;
        } else {
            console.warn(`[FlavorDB] API returned empty pairings for '${apiQueryIngredient}'.`);
            return [apiQueryIngredient];
        }
    } catch (e) {
        console.error(`[FlavorDB] Live API connection failed:`, e);
        return [apiQueryIngredient];
    }
}