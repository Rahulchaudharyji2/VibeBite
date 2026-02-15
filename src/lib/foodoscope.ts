// ============================================
// Foodoscope Scientific Recipe Engine (Restored Intelligence)
// ============================================

import { getMolecularPairings } from "./flavordb";
import fs from "fs";
import path from "path";

const API_KEY = process.env.FOODOSCOPE_API_KEY || "";
const BASE_URL = "https://api.foodoscope.com/recipe2-api";
const CACHE_TTL = 10 * 60 * 1000;

interface CachedResults {
    data: any[];
    timestamp: number;
}
const searchCache = new Map<string, CachedResults>();

// DETERMINISTIC DEEP SCAN REGISTRY
// Stores raw recipes from multiple pages to allow local search without rate limits
let recipeRegistry: any[] = [];
let registryLastFetched = 0;
let registryFailedTimestamp = 0;
const REGISTRY_TTL = 30 * 60 * 1000; // 30 minutes
const FAILED_COOLOFF = 2 * 60 * 1000; // 2 minutes cooloff after 429

// Initial Seed Loading
const loadSeedRecipes = () => {
    try {
        const seedPath = path.join(process.cwd(), "src/data/seed-recipes.json");
        if (fs.existsSync(seedPath)) {
            const data = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
            return data.recipes || [];
        }
    } catch (err) {
        console.warn("[Engine] No seed recipes found.");
    }
    return [];
};

recipeRegistry = loadSeedRecipes();

// ============================================
// CORE API CALL
// ============================================

export async function fetchFromApi(endpoint: string, params: Record<string, string> = {}) {
    const queryList = { ...params, _: Date.now().toString() };
    const query = new URLSearchParams(queryList).toString();
    const url = `${BASE_URL}${endpoint}?${query}`;

    try {
        console.log(`[Engine] Fetching: ${url}`);
        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[Engine] API Error (${res.status}): ${errorText.slice(0, 100)}`);
            try {
                return JSON.parse(errorText);
            } catch {
                return { error: `HTTP ${res.status}`, message: errorText };
            }
        }
        return await res.json();
    } catch (err: any) {
        console.error(`[Engine] Fetch Exception: ${err.message}`);
        return { error: "FetchException", message: err.message };
    }
}

export async function fetchRecipesBatch(page: number = 1, limit: number = 50, params: Record<string, string> = {}) {
    return fetchFromApi("/recipe/recipesinfo", { page: String(page), limit: String(limit), ...params });
}

// ============================================
// DETERMINISTIC DEEP SCAN REGISTRY
// ============================================

let isWarmingUp = false;

const getRegistry = async (mode: "strided" | "sequential" = "sequential") => {
    // 1. Check if we have valid cache
    if (recipeRegistry.length > seedDataSize() && Date.now() - registryLastFetched < REGISTRY_TTL) {
        return recipeRegistry;
    }

    // 2. Cooloff check (if we recently hit 429)
    if (Date.now() - registryFailedTimestamp < FAILED_COOLOFF) {
        console.warn(`[Engine] Registry in cooloff period. Using cache of ${recipeRegistry.length} recipes.`);
        return recipeRegistry;
    }

    if (isWarmingUp) {
        console.log("[Engine] Registry warming in progress... waiting.");
        while (isWarmingUp) {
            await new Promise(r => setTimeout(r, 1000));
        }
        return recipeRegistry;
    }

    isWarmingUp = true;
    console.log(`[Engine] Warming up Deterministic Registry (Strict Rate Limit Mode)...`);
    
    // Fetch first 5 pages sequentially to stay well within 25 RPM (1 request every 2.5s)
    const pages = [1, 2, 3, 4, 10]; // Reduced to 5 high-value pages
    const newBatch: any[] = [];

    try {
        for (const p of pages) {
            console.log(`[Engine] Fetching Page ${p}...`);
            const result = await fetchFromApi("/recipe/recipesinfo", { page: String(p), limit: "50" });
            
            if (result?.payload?.data) {
                newBatch.push(...result.payload.data);
                console.log(`[Engine] Page ${p} loaded: ${result.payload.data.length} recipes.`);
            } else if (result?.error?.includes("429") || result?.error === "Rate Limit Exceeded") {
                console.error("[Engine] 429 Hit during warmup. Starting cooloff.");
                registryFailedTimestamp = Date.now();
                break;
            } else {
                console.warn(`[Engine] Page ${p} failed: ${result?.error || result?.message || "Unknown error"}`);
            }
            // 2.5s delay = 24 RPM max
            await new Promise(r => setTimeout(r, 2500));
        }
    } finally {
        isWarmingUp = false;
    }
    
    if (newBatch.length > 0) {
        // Merge with seed but keep registry healthy
        const seed = loadSeedRecipes();
        const seenIds = new Set(seed.map((r: any) => r.Recipe_id));
        const uniqueNew = newBatch.filter(r => !seenIds.has(r.Recipe_id));
        
        recipeRegistry = [...seed, ...uniqueNew];
        registryLastFetched = Date.now();
        console.log(`[Engine] Registry Updated: ${recipeRegistry.length} total recipes.`);
    }
    
    return recipeRegistry;
};

// Helper for seed size
function seedDataSize() {
    return 4; // Our Magpie/Karela/Chicken/Mint seed
}

export async function scanRecipes(mode: "strided" | "sequential" = "strided", query: string = "") {
    const rawData = await getRegistry(mode);
    
    if (mode === "sequential") {
        // Return only the first few pages' worth of data for strict sequence
        return rawData.slice(0, 250); 
    }
    
    return rawData;
}

function mapRecipeData(raw: any[], molecules: string[] = []) {
    return raw.map(r => {
        const title = r.Recipe_title || "Recipe";
        return {
            id: r.Recipe_id,
            title,
            image: r.img_url || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c`,
            time: `${r.total_time || 30} min`,
            calories: Number(r.Calories || 0),
            sodium: Number(r["Sodium, Na (mg)"] || 0),
            rating: 4.5,
            scientificMatch: molecules.length > 0 
                ? molecules.find(m => title.toLowerCase().includes(m.toLowerCase())) || "Scientific Match"
                : "Standard Match",
            macros: {
                protein: Number(r["Protein (g)"] || 0),
                carbs: Number(r["Carbohydrate, by difference (g)"] || 0),
                fat: Number(r["Total lipid (fat) (g)"] || 0)
            },
            region: r.Region || "Global"
        };
    });
}

// ============================================
// MOOD & VIBE SEARCH (getRecipesByFlavor)
// ============================================

export async function getRecipesByFlavor(flavor: string, isLowSalt: boolean = false, goals: string[] = [], region?: string) {
    const cacheKey = `deep_vibe_${flavor}_${isLowSalt}_${region || 'all'}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    console.log(`[Engine] Analyzing Vibe: ${flavor}`);
    
    // Step 1: Get Deep Molecular Matrix from FlavorDB
    const molecules = await getMolecularPairings(flavor);
    
    // Step 2: Perform Strided Scan for Diversity
    const rawData = await scanRecipes("strided");
    
    // Step 3: Scientific Local Filter
    const filtered = rawData.filter((r) => {
        const title = (r.Recipe_title ?? "").toLowerCase();
        return molecules.some((ing) => title.includes(ing.toLowerCase())) || title.includes(flavor.toLowerCase());
    });

    let processed = mapRecipeData(filtered.length > 0 ? filtered : rawData, molecules);
    processed = applyHealthGuards(processed, goals, isLowSalt);

    const finalResults = processed.slice(0, 12);
    searchCache.set(cacheKey, { data: finalResults, timestamp: Date.now() });
    return finalResults;
}

// ============================================
// AI INTENT EXTRACTION
// ============================================

export async function extractSearchIntent(query: string): Promise<{ keywords: string[], goals: string[] }> {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    console.log(`[Engine] Intent extraction for "${query}". AI Key present: ${!!GEMINI_API_KEY}`);

    if (GEMINI_API_KEY) {
        try {
            const prompt = `You are a culinary research AI.
            Transform this user craving into searchable database keywords.
            User craving: "${query}"
            
            Rules:
            - Extract ONLY the core food entities (ingredients, dish names).
            - Ignore filler words like "something", "I want", "for a".
            - Identify health goals: "low-sodium", "vegan", "keto", "high-protein".
            
            Output MUST be valid JSON:
            {
              "keywords": ["Spicy", "Soup", "Noodles"],
              "goals": ["low-sodium"]
            }`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        maxOutputTokens: 150,
                        temperature: 0.1,
                        responseMimeType: "application/json" 
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                text = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const parsed = JSON.parse(text);
                return {
                    keywords: parsed.keywords || [],
                    goals: parsed.goals || []
                };
            } else {
                console.error(`[Engine] Gemini API Error (${response.status}): ${await response.text()}`);
            }
        } catch (e) {
            console.error("[Engine] AI Intent Extraction failed:", e);
        }
    }

    // SMART FALLBACK
    const fillers = ["something", "i", "want", "for", "a", "the", "some", "with", "me", "craving", "can", "you", "find"];
    const keywords = query.toLowerCase().split(" ").filter(w => w.length > 2 && !fillers.includes(w));
    return { keywords: keywords.length > 0 ? keywords : [query], goals: [] };
}

export async function searchRecipes(query: string, goals: string[] = [], isLowSalt: boolean = false, region?: string) {
    const cacheKey = `search_${query}_${isLowSalt}_${region || 'all'}_${goals.join(",")}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    console.log(`[Engine] Deterministic Search: ${query}`);
    
    let q = query.toLowerCase().trim();
    let activeGoals = [...goals];

    // Step 1: Get data from Registry
    const rawData = await scanRecipes("strided", q);
    
    // Step 2: Attempt Direct Match
    let filtered = rawData.filter((r) => {
        const title = (r.Recipe_title || r.recipe_title || r.title || "").toLowerCase();
        return title.includes(q) || q.split(" ").every(word => title.includes(word));
    });

    // Step 3: AI intent extraction if direct matching is weak
    if (filtered.length < 2 && q.length > 5) {
        console.log(`[Engine] Search weak for "${q}". Extracting AI Intent...`);
        const intent = await extractSearchIntent(q);
        console.log(`[Engine] AI Intent:`, intent);
        
        activeGoals = Array.from(new Set([...activeGoals, ...intent.goals]));
        
        filtered = rawData.filter((r) => {
            const title = (r.Recipe_title || r.recipe_title || r.title || "").toLowerCase();
            return intent.keywords.some(keyword => title.includes(keyword.toLowerCase()));
        });
    }

    // Step 4: Map and Refine
    let processed = mapRecipeData(filtered.length > 0 ? filtered : rawData.slice(0, 10), []);
    processed = applyHealthGuards(processed, activeGoals, isLowSalt);

    // Step 5: Deterministic Ranking
    processed.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1;
        if (!aTitle.startsWith(q) && bTitle.startsWith(q)) return 1;
        return 0;
    });

    const results = processed.slice(0, 12);
    searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
}

// ============================================
// UTILITIES
// ============================================

function applyHealthGuards(recipes: any[], goals: string[], isLowSalt: boolean) {
    console.log(`[Engine] Applying Guards. Goals: ${goals.join(",")}, LowSalt: ${isLowSalt}, Input Count: ${recipes.length}`);
    let filtered = recipes;
    
    // 1. Heart Guard (Global Preference)
    if (isLowSalt) {
        filtered = filtered.filter(r => r.sodium < 200); 
    }
    
    // 2. High-Protein Goal
    if (goals.includes("high-protein")) {
        filtered = filtered.filter(r => r.macros.protein > 15);
    }

    // 3. Keto Goal
    if (goals.includes("keto")) {
        filtered = filtered.filter(r => r.macros.carbs < 20);
    }

    // 4. Low Sodium Goal (Explicit)
    if (goals.includes("low-sodium")) {
        filtered = filtered.filter(r => r.sodium < 400);
    }

    // 5. Vegan Goal
    if (goals.includes("vegan")) {
        const animalProds = ["chicken", "beef", "meat", "egg", "fish", "pork", "milk", "chees", "lamb", "shrimp", "yogurt", "butter", "honey", "dairy", "cream", "paneer", "ghee", "lard"];
        filtered = filtered.filter(r => {
            const lowerTitle = (r.title || "").toLowerCase();
            const isNonVegan = animalProds.some(ap => lowerTitle.includes(ap));
            return !isNonVegan;
        });
    }

    // 6. Low Calorie Goal
    if (goals.includes("low-calorie")) {
        filtered = filtered.filter(r => r.calories < 400);
    }
    
    return filtered.slice(0, 12);
}

export async function getRecipeById(id: string) {
    const data = await fetchFromApi("/recipe/recipesinfo", { "Recipe_id": id, "limit": "1" });
    const found = data?.payload?.data?.[0];
    if (!found) return null;

    return {
        id,
        title: found.Recipe_title,
        image: found.img_url || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c`,
        time: `${found.total_time || 30} min`,
        calories: Number(found.Calories || 0),
        description: found.Processes?.replaceAll("||", ". ") || "A delicious recipe discovered by VibeBite Intelligence.",
        ingredients: found.Ingredients?.split("||").map((i: string) => i.trim()) || [],
        nutrients: {
            sodium: `${found["Sodium, Na (mg)"] || 0}mg`,
            protein: `${found["Protein (g)"] || 0}g`,
            carbs: `${found["Carbohydrate, by difference (g)"] || 0}g`,
            fat: `${found["Total lipid (fat) (g)"] || 0}g`
        }
    };
}
