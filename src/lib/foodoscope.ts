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

async function fetchRecipesBatch(
    page: number = 1,
    limit: number = 50
) {
    const data = await fetchFromApi(
        "/recipe/recipesinfo",
        {
            page: String(page),
            limit: String(limit)
        }
    );

    if (!data?.payload?.data)
        return [];

    return data.payload.data;
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

    let recipes =
        rawRecipes.map((r) => {
            const title =
                r.Recipe_title ??
                "Unknown Recipe";

            return {
                id: r.Recipe_id,

                title,

                image:
                    r.img_url ??
                    getFallbackImage(
                        title
                    ),

                time: `${r.total_time ??
                    30
                    } min`,

                calories:
                    Number(
                        r.Calories ??
                        r[
                        "Energy (kcal)"
                        ] ??
                        0
                    ),

                sodium:
                    Number(
                        r[
                        "Sodium, Na (mg)"
                        ] ?? 0
                    ),

                rating: 4.5,

                scientificMatch:
                    molecularIngredients.find(
                        (i) =>
                            title
                                .toLowerCase()
                                .includes(
                                    i.toLowerCase()
                                )
                    ) ??
                    "General Match",

                macros: {
                    protein:
                        Number(
                            r[
                            "Protein (g)"
                            ] ?? 0
                        ),

                    carbs:
                        Number(
                            r[
                            "Carbohydrate, by difference (g)"
                            ] ?? 0
                        ),

                    fat:
                        Number(
                            r[
                            "Total lipid (fat) (g)"
                            ] ?? 0
                        )
                },

                region:
                    r.Region ??
                    "Global",

                subRegion:
                    r.Sub_region
            };
        });

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
    query: string,
    isLowSalt = false
) {
    return getRecipesByFlavor(
        query,
        isLowSalt
    );
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
