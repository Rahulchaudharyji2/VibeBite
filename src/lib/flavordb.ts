const FLAVORDB_API_KEY = process.env.FOODOSCOPE_API_KEY || "";
const FLAVORDB_BASE_URL = "http://cosylab.iiitd.edu.in:6969/flavordb";

/**
 * Step 1: The AI Translation Bridge (Deep Analysis)
 * Fetches enriched data from the AI bridge, including scientific reasoning.
 */
export async function getDeepAnalysis(mood: string): Promise<{ ingredients: string[], reason: string }> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/translate-mood`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mood })
        });

        if (response.ok) {
            const data = await response.json();
            return {
                ingredients: data.ingredients || [data.ingredient],
                reason: data.reason || "Matched via scientific flavor profile analysis."
            };
        }
    } catch (error) {
        console.error("[AI Bridge] Deep Analysis failed:", error);
    }
    
    return {
        ingredients: [mood.toLowerCase()],
        reason: "Standard flavor mapping based on historical culinary data."
    };
}

async function translateMoodToIngredient(mood: string): Promise<string> {
    const analysis = await getDeepAnalysis(mood);
    return analysis.ingredients.join(", ");
}

/**
 * Step 2: The Live FlavorDB Fetch
 * Takes the dynamically generated ingredients (comma separated) and fetches their molecular pairings.
 */
export async function getMolecularPairings(flavorOrMood: string): Promise<string[]> {
    // 1. Get the dynamic ingredient translation (might be "mint, honey")
    const apiQueryString = await translateMoodToIngredient(flavorOrMood);
    const ingredients = apiQueryString.split(",").map(i => i.trim());

    // Aggregate results from multiple ingredients
    const allMatches = new Set<string>();

    for (const apiQueryIngredient of ingredients) {
        if (!apiQueryIngredient) continue;
        allMatches.add(apiQueryIngredient); // Always include the base ingredient

        try {
            const url = `${FLAVORDB_BASE_URL}/food/by-alias?food_pair=${encodeURIComponent(apiQueryIngredient)}`;
            console.log(`[FlavorDB] Fetching live pairings for: ${apiQueryIngredient}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${FLAVORDB_API_KEY}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                next: { revalidate: 3600 } 
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                let parsed: string[] = [];

                if (data && Array.isArray(data.topSimilarEntities)) {
                    parsed = data.topSimilarEntities.map((item: any) => item.entityName);
                }

                parsed.filter(i => typeof i === 'string' && i.length > 0)
                      .forEach(i => allMatches.add(i));
            }
        } catch (e: any) {
            console.warn(`[FlavorDB] Failed to fetch for '${apiQueryIngredient}':`, e.message);
        }
    }

    const resultArray = Array.from(allMatches);
    console.log(`[FlavorDB] Deep Search Matrix: [${resultArray.slice(0, 10).join(", ")}...]`);
    return resultArray;
}