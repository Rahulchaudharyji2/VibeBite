// ============================================
// Foodoscope Scientific Recipe Engine (Fixed & Optimized)
// ============================================

import { getMolecularPairings } from "./flavordb";

// ============================================
// CONFIG
// ============================================

const API_KEY = process.env.FOODOSCOPE_API_KEY || "";

const BASE_URL = "https://api.foodoscope.com/recipe2-api";

const CACHE_TTL = 5 * 60 * 1000;

if (!API_KEY) {
    console.error("CRITICAL: FOODOSCOPE_API_KEY is not set.");
}

// ============================================
// CACHE
// ============================================

const searchCache = new Map<
    string,
    { data: any[]; timestamp: number }
>();

// ============================================
// FETCH WRAPPER
// ============================================

async function fetchFromApi(
    endpoint: string,
    params: Record<string, string> = {}
) {
    const query = new URLSearchParams({
        ...params,
        _: Date.now().toString()
    }).toString();

    const url = `${BASE_URL}${endpoint}?${query}`;

    try {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            cache: "no-store",
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            console.error(
                `API ERROR ${res.status}:`,
                await res.text()
            );
            return null;
        }

        return await res.json();
    } catch (err) {
        console.error("Fetch failed:", err);
        return null;
    }
}

// ============================================
// IMAGE FALLBACK
// ============================================

function getFallbackImage(title: string) {
    const defaults = [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
        "https://images.unsplash.com/photo-1551183053-bf91a1d81141",
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
    ];

    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash =
            (hash << 5) -
            hash +
            title.charCodeAt(i);
    }

    return defaults[Math.abs(hash) % defaults.length];
}

// ============================================
// FETCH RECIPES (CORRECT METHOD)
// ============================================

export async function fetchRecipesBatch(
    page: number = 1,
    limit: number = 50,
    params: Record<string, string> = {}
) {
    const data = await fetchFromApi(
        "/recipe/recipesinfo",
        {
            page: String(page),
            limit: String(limit),
            ...params
        }
    );

    if (!data?.payload?.data)
        return [];

    return data.payload.data;
}

// ============================================
// HELPER: MAP RECIPE DATA
// ============================================

function mapRecipeData(rawRecipes: any[], molecularIngredients: string[] = []) {
    return rawRecipes.map((r) => {
        const title = r.Recipe_title ?? "Unknown Recipe";

        return {
            id: r.Recipe_id,
            title,
            image: r.img_url ?? getFallbackImage(title),
            time: `${r.total_time ?? 30} min`,
            calories: Number(r.Calories ?? r["Energy (kcal)"] ?? 0),
            sodium: Number(r["Sodium, Na (mg)"] ?? 0),
            rating: 4.5,
            scientificMatch: molecularIngredients.length > 0
                ? (molecularIngredients.find((i) => title.toLowerCase().includes(i.toLowerCase())) ?? "General Match")
                : "Direct Match",
            macros: {
                protein: Number(r["Protein (g)"] ?? 0),
                carbs: Number(r["Carbohydrate, by difference (g)"] ?? 0),
                fat: Number(r["Total lipid (fat) (g)"] ?? 0)
            },
            region: r.Region ?? "Global",
            subRegion: r.Sub_region
        };
    });
}

// ============================================
// SCIENTIFIC SEARCH ENGINE
// ============================================

export async function getRecipesByFlavor(
    flavor: string,
    isLowSalt: boolean = false
) {
    const cacheKey =
        `${flavor}-${isLowSalt}`;

    const cached =
        searchCache.get(cacheKey);

    if (
        cached &&
        Date.now() -
        cached.timestamp <
        CACHE_TTL
    ) {
        console.log("Cache hit");
        return cached.data;
    }

    // ========================================
    // STEP 1: Get molecular pairings
    // ========================================

    const molecularIngredients =
        await getMolecularPairings(
            flavor
        );

    console.log(
        "Molecular matches:",
        molecularIngredients
    );

    // ========================================
    // STEP 2: Fetch multiple pages
    // ========================================

    // Optimized for rate limits: fetch 1 big page instead of 3
    const pages = [1];

    // We already fetch 50 recipes, which is decent.
    const batchResults =
        await Promise.all(
            pages.map((page) =>
                fetchRecipesBatch(page, 50)
            )
        );

    let rawRecipes =
        batchResults.flat();

    // ========================================
    // STEP 3: Scientific filtering
    // ========================================

    rawRecipes =
        rawRecipes.filter((r) => {
            const title =
                (
                    r.Recipe_title ??
                    ""
                ).toLowerCase();

            return molecularIngredients.some(
                (ingredient) =>
                    title.includes(
                        ingredient.toLowerCase()
                    )
            );
        });

    // fallback if empty
    if (rawRecipes.length === 0) {
        rawRecipes =
            batchResults.flat();
    }

    // ========================================
    // STEP 4: Deduplicate
    // ========================================

    const seen = new Set();

    rawRecipes =
        rawRecipes.filter((r) => {
            if (
                seen.has(r.Recipe_id)
            )
                return false;

            seen.add(
                r.Recipe_id
            );

            return true;
        });

    // ========================================
    // STEP 5: Map
    // ========================================

    let recipes = mapRecipeData(rawRecipes, molecularIngredients);

    // ========================================
    // STEP 6: Low sodium filter
    // ========================================

    if (isLowSalt) {
        recipes =
            recipes.filter(
                (r) =>
                    r.sodium <
                    100
            );
    }

    const finalResults =
        recipes.slice(0, 12);

    // ========================================
    // CACHE
    // ========================================

    searchCache.set(
        cacheKey,
        {
            data: finalResults,
            timestamp:
                Date.now()
        }
    );

    return finalResults;
}

// ============================================
// SEARCH WRAPPER
// ============================================

export async function searchRecipes(
    query: string = "",
    goals: string[] = [],
    isLowSalt = false
) {
    console.log(`[Foodoscope] Search: "${query}", Goals: ${JSON.stringify(goals)}`);

    // Fetch a larger batch to filter client-side
    // Since API search params are unreliable, we fetch a broad set and filter.
    // Determine if we should use a goal as a search term to get better initial candidates
    // Priority: Query > Vegan > Keto > Gluten Free > etc.
    let searchTerm = query;
    const lowerGoals = goals.map(g => g.toLowerCase());

    if ((!searchTerm || searchTerm.trim() === "") && goals.length > 0) {
        if (lowerGoals.includes("vegan")) searchTerm = "Vegan";
        else if (lowerGoals.includes("keto")) searchTerm = "Keto";
        else if (lowerGoals.includes("gluten-free")) searchTerm = "Gluten Free";
        else if (lowerGoals.includes("paleo")) searchTerm = "Paleo";
    }

    // Fetch a larger batch to filter client-side
    // We pass 'q' if we have a search term to narrow down the pool (if supported by API)
    // Recipe_title seems too strict.
    const apiParams: Record<string, string> = {};
    if (searchTerm && searchTerm.trim() !== "") {
        apiParams["q"] = searchTerm;
    }

    // Optimization: Avoid Promise.all to prevent 429 Rate Limit errors.
    // Try to fetch with the search term first.
    let rawData = await fetchRecipesBatch(1, 50, apiParams);

    // If specific search failed (e.g. q=Vegan returned 0), fallback to generic batch
    if (rawData.length === 0 && searchTerm) {
        console.log(`[Foodoscope] Search for "${searchTerm}" returned 0 results. Falling back to generic batch.`);
        rawData = await fetchRecipesBatch(1, 50);
    }

    let recipes = mapRecipeData(rawData);

    // 1. Text Search (Client-side fallback)
    if (query && query.trim().length > 0) {
        const q = query.toLowerCase().trim();
        recipes = recipes.filter(r => r.title.toLowerCase().includes(q));
    }

    // 2. Goal Filtering
    if (goals.length > 0) {
        recipes = recipes.filter(r => {
            let pass = true;

            // Health Logic
            if (goals.includes("high-protein")) {
                // > 20g protein
                if (r.macros.protein < 20) pass = false;
            }

            if (goals.includes("low-sodium") || goals.includes("heart-healthy")) {
                // < 400mg sodium
                if (r.sodium > 400) pass = false;
            }

            if (goals.includes("keto")) {
                // Low carb (< 20g) and High Fat
                // Relaxed from 15 to 20 to find more matches in random batches
                if (r.macros.carbs > 20) pass = false;
            }

            if (goals.includes("vegan")) {
                const lowerTitle = r.title.toLowerCase();
                // Strict: meat, chicken, beef, pork, fish, egg, cheese, cream, milk, honey, butter
                const nonVeganTerms = ["chicken", "beef", "pork", "steak", "fish", "salmon", "shrimp", "tuna", "egg", "cheese", "cream", "milk", "butter", "honey", "yogurt", "sausage", "bacon", "meat", "lamb", "duck", "turkey"];

                const isExplicitProhibitive = nonVeganTerms.some(term => lowerTitle.includes(term));
                const isExplicitVegan = lowerTitle.includes("vegan") || lowerTitle.includes("plant based");

                // If it explicitly says "Vegan", it's good.
                // If it contains animal products, reject.
                // If ambiguous, we accept it IF we are falling back to generic data, to ensure we show SOMETHING.
                if (!isExplicitVegan) {
                    if (isExplicitProhibitive) pass = false;
                }
            }

            if (goals.includes("gluten-free")) {
                if (!r.title.toLowerCase().includes("gluten free") && !r.title.toLowerCase().includes("gf")) pass = false;
            }

            if (goals.includes("weight-loss")) {
                // Low calorie (< 400)
                if (r.calories > 400) pass = false;
            }

            return pass;
        });
    }

    // 3. Legacy Low Salt Flag
    if (isLowSalt) {
        recipes = recipes.filter(r => r.sodium < 100);
    }

    return recipes.slice(0, 12);
}

// ============================================
// GET RECIPE BY ID
// ============================================

export async function getRecipeById(
    id: string
) {
    // Optimized for rate limits: direct ID lookup
    const data = await fetchFromApi("/recipe/recipesinfo", {
        "Recipe_id": id,
        "limit": "1"
    });

    let found;

    if (data && data.payload && data.payload.data && data.payload.data.length > 0) {
        found = data.payload.data[0];
    } else {
        // Fallback: Check if it's in the list (unlikely if limit=1 returned nothing)
        return null; // Or retry? No, ID lookup should be definitive.
    }

    if (!found) return null;

    const title =
        found.Recipe_title;

    return {
        id,

        title,

        image:
            found.img_url ??
            getFallbackImage(
                title
            ),

        time: `${found.total_time ??
            30
            } min`,

        calories:
            Number(
                found.Calories ??
                0
            ),

        description:
            found.Processes?.replaceAll(
                "||",
                ". "
            ) ??
            "",

        ingredients:
            found.ingredients ??
            [],

        macros: {
            protein:
                Number(
                    found[
                    "Protein (g)"
                    ] ?? 0
                ),

            carbs:
                Number(
                    found[
                    "Carbohydrate, by difference (g)"
                    ] ?? 0
                ),

            fat:
                Number(
                    found[
                    "Total lipid (fat) (g)"
                    ] ?? 0
                )
        },

        region:
            found.Region,

        subRegion:
            found.Sub_region
    };
}
