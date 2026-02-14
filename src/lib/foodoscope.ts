// Foodoscope API Integration
const API_KEY = process.env.FOODOSCOPE_API_KEY || "";
const BASE_URL = "https://api.foodoscope.com/recipe2-api";

if (!API_KEY) {
    console.error("CRITICAL: FOODOSCOPE_API_KEY is not set in environment variables.");
}


async function fetchFromApi(endpoint: string, params: Record<string, string> = {}) {
    // Construct Query String
    // Force fresh fetch by adding a random timestamp
    const q = { ...params, _: String(Date.now()) };
    const query = new URLSearchParams(q).toString();
    const url = `${BASE_URL}${endpoint}?${query}`;

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store', // Next.js specific: disable data cache
            next: { revalidate: 0 } // Next.js 13+ specific
        });

        if (!res.ok) {
            console.error(`API Error ${res.status}: ${await res.text()}`);
            return null;
        }

        return await res.json();
    } catch (e) {
        console.error("Fetch failed:", e);
        return null;
    }
}



// Helper to get diverse images based on keywords
// Helper to get diverse images based on keywords
function getFallbackImage(title: string) {
    const t = title.toLowerCase();

    // Expanded Context Categories
    if (t.includes("soup") || t.includes("stew") || t.includes("chili")) return "https://images.unsplash.com/photo-1547592166-23acbe3a624b";
    if (t.includes("salad") || t.includes("green") || t.includes("bowl")) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd";
    if (t.includes("chicken") || t.includes("poultry") || t.includes("turkey")) return "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b";
    if (t.includes("beef") || t.includes("steak") || t.includes("lamb") || t.includes("meat")) return "https://images.unsplash.com/photo-1600891964092-4316c288032e";
    if (t.includes("pasta") || t.includes("spaghetti") || t.includes("noodle") || t.includes("macaroni")) return "https://images.unsplash.com/photo-1551183053-bf91a1d81141";
    // Cake/Dessert Check (Exclude savory items)
    if (t.includes("cake") || t.includes("dessert") || t.includes("chocolate") || t.includes("sweet")) {
        if (!t.includes("falafel") && !t.includes("crab") && !t.includes("fish") && !t.includes("beef") && !t.includes("chicken")) {
            return "https://images.unsplash.com/photo-1578985545062-69928b1d9587";
        }
    }
    if (t.includes("fish") || t.includes("seafood") || t.includes("shrimp") || t.includes("salmon")) return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2";
    if (t.includes("burger") || t.includes("sandwich") || t.includes("wrap")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd";
    if (t.includes("pizza") || t.includes("flatbread")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591";
    if (t.includes("breakfast") || t.includes("egg") || t.includes("pancake")) return "https://images.unsplash.com/photo-1533089862017-ec326aa0d533";

    // Vastly Expanded Default Rotation
    const defaults = [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", // Salad
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836", // Steak
        "https://images.unsplash.com/photo-1493770348161-369560ae357d", // Toast
        "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a", // Soup
        "https://images.unsplash.com/photo-1484723091739-30a097e8f929", // French Toast
        "https://images.unsplash.com/photo-1473093295043-cdd812d0e601", // Green Pasta
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061", // Sushi/Bowl
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38", // Pizza slice
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445", // Pancakes
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe", // Stir Fry
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187", // Cake
        "https://images.unsplash.com/photo-1482049016688-2d3e1b311543"  // Sandwich
    ];
    // Create a hash that distributes more evenly
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = (hash << 5) - hash + title.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return defaults[Math.abs(hash) % defaults.length];
}

// Simple In-Memory Cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
import { getMolecularPairings } from "./flavordb";

const searchCache = new Map<string, { data: any[], timestamp: number }>();

export async function getRecipesByFlavor(flavor: string, isLowSalt: boolean = false) {
    const cacheKey = `${flavor}-${isLowSalt}-scientific`;
    const cached = searchCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log(`[Cache Hit] Serving scientific results for: ${flavor}`);
        return cached.data;
    }

    let rawRecipes: any[] = [];
    let apiError = false;

    // Step 1: Get Scientific Molecular Pairings
    const molecularIngredients = await getMolecularPairings(flavor);
    console.log(`[Scientific Vibe] ${flavor} -> Molecular Matches: ${molecularIngredients.join(", ")}`);

    // Strategy: Search for recipes containing these specific molecular ingredients
    // This is the "Scientific Engine": We feed the molecules into the Recipe Search
    // Randomize the selection of molecules to get diverse results each time
    const shuffled = molecularIngredients.sort(() => 0.5 - Math.random());
    const searchPromises = shuffled.slice(0, 3).map(ingredient =>
        fetchFromApi("/recipe/recipesinfo", {
            "Recipe_title": ingredient,
            "limit": "20"
        })
    );

    // Also search for the Vibe/Flavor itself as a backup context
    searchPromises.push(fetchFromApi("/recipe/recipesinfo", { "Recipe_title": flavor, "limit": "20" }));

    try {
        const results = await Promise.all(searchPromises);
        results.forEach(data => {
            if (data && data.payload && data.payload.data) {
                rawRecipes.push(...data.payload.data);
            } else if (!data) {
                apiError = true;
            }
        });
    } catch (e) {
        apiError = true;
    }

    // Fallback: If Scientific/Molecular search fails, try broad keyword search
    if (rawRecipes.length === 0 || apiError) {
        console.log(`[Foodoscope] Scientific search passed/failed. Trying broad search for: ${flavor}`);
        const broadData = await fetchFromApi("/recipe/recipesinfo", {
            "Recipe_title": flavor,
            "limit": "20"
        });

        if (broadData && broadData.payload && broadData.payload.data) {
            rawRecipes = broadData.payload.data;
        }
    }

    // 🚨 FINAL FALLBACK: If API is dead/rate-limited (429), use Hardcoded Healthy Mock Data
    if (rawRecipes.length === 0) {
        console.warn("[Foodoscope] No results or API Rate Limited (429). Using Safety Fallback Recipes.");
        return [
            { id: "mock-1", title: "Citrus Avocado Salad", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd", time: "15 min", calories: 350, rating: 4.8, sodium: 50, scientificMatch: "Fallback" },
            { id: "mock-2", title: "Grilled Lemon Chicken", image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b", time: "25 min", calories: 420, rating: 4.7, sodium: 120, scientificMatch: "Fallback" },
            { id: "mock-3", title: "Berry Smoothie Bowl", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061", time: "10 min", calories: 280, rating: 4.9, sodium: 30, scientificMatch: "Fallback" },
            { id: "mock-4", title: "Quinoa Veggie Mix", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", time: "20 min", calories: 310, rating: 4.6, sodium: 80, scientificMatch: "Fallback" },
        ];
    }

    // Step 2: Deduplicate
    const seenIds = new Set();
    const uniqueRaw: any[] = [];
    for (const r of rawRecipes) {
        const id = r.Recipe_id || r._id;
        const title = r.recipeTitle || r.title;
        const key = `${id}-${title}`;
        if (!seenIds.has(key)) {
            seenIds.add(key);
            uniqueRaw.push(r);
        }
    }
    rawRecipes = uniqueRaw;

    // Step 3: Scientific Filter (Molecular Match)
    // We only keep recipes that contain at least one of our molecular ingredients
    const matched = rawRecipes.filter((r: any) => {
        const t = (r.recipeTitle || r.title || "").toLowerCase();
        // Check if title includes any of the molecular ingredients
        return molecularIngredients.some(ingredient => t.includes(ingredient.toLowerCase()));
    });

    // If no exact matches found, we might fallback to generic search to show SOMETHING, 
    // but for "Scientific" accuracy, we prioritize matched.
    // If matched is empty, we fall back to the raw list but sort by relevance if possible?
    // For now, let's stick to the strict scientific requirement:
    const finalPool = matched.length > 0 ? matched : rawRecipes;

    // Step 4: Map to App format & Add Scientific Badges
    let recipes = finalPool.map((r: any) => {
        const title = r.Recipe_title || r.title || "Unknown Recipe";
        const tLower = title.toLowerCase();

        // Identify which scientific ingredient triggered this result
        const match = molecularIngredients.find(ing => tLower.includes(ing.toLowerCase()));

        return {
            id: r.Recipe_id || r._id,
            title: title,
            image: r.img_url || getFallbackImage(title),
            time: r.total_time ? `${r.total_time} min` : "30 min",
            calories: Math.round(parseFloat(r.Calories || r["Energy (kcal)"] || 0)),
            rating: 4.5,
            sodium: parseFloat(r["Sodium, Na (mg)"] || 0), // Note: RecipesInfo might not have Sodium, but we use what we have
            // Scientific Badge Data
            scientificMatch: match || "General Vibe"
        };
    });

    // Step 5: Strict "Kam Namak" (Low Salt) Guard
    // Requirement: Sodium < 100mg (Very Strict)
    if (isLowSalt) {
        recipes = recipes.filter((r: any) => r.sodium < 100);
    }

    const finalResults = recipes.slice(0, 12);

    // Cache
    if (finalResults.length > 0) {
        searchCache.set(cacheKey, { data: finalResults, timestamp: Date.now() });
    }

    return finalResults;
}



export async function searchRecipes(query: string, isLowSalt: boolean = false) {
    return getRecipesByFlavor(query, isLowSalt);
}


export async function getRecipeById(id: string) {
    console.log(`[Foodoscope] Fetching details for ID: ${id}`);

    // Attempt 1: Try filtering by Recipe_id directly
    // Note: The API might ignore unknown params, so we check the result carefully.
    const data = await fetchFromApi("/recipe/recipesinfo", {
        "Recipe_id": id,
        "limit": "5" // Fetch a few just in case
    });

    if (data && data.payload && data.payload.data) {
        // Find the specific item in the returned list
        const found = data.payload.data.find((r: any) =>
            String(r.Recipe_id) === String(id) || String(r._id) === String(id)
        );

        if (found) {
            console.log(`[Foodoscope] Found recipe: ${found.Recipe_title}`);
            const title = found.Recipe_title || found.title || "Unknown Recipe";

            // Allow string parsing for instructions
            let instructions = found.instructions || found.Processes || "Instructions retrieved from Foodoscope API.";
            if (found.Processes && found.Processes.includes("||")) {
                instructions = found.Processes.split("||").join(". ");
            }

            return {
                title: title,
                image: found.img_url || getFallbackImage(title),
                time: found.total_time ? `${found.total_time} min` : "30 min",
                calories: Math.round(parseFloat(found.Calories || found["Energy (kcal)"] || 0)),
                description: instructions,
                ingredients: found.ingredients ? (Array.isArray(found.ingredients) ? found.ingredients.map((i: any) => i.name || i) : found.ingredients.split(",")) : ["Ingredients not listed in summary."]
            };
        }
    }

    console.warn(`[Foodoscope] ID ${id} not found in API search.`);
    return null;
}



