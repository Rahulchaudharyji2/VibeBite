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
    if (t.includes("cake") || t.includes("dessert") || t.includes("chocolate") || t.includes("sweet")) return "https://images.unsplash.com/photo-1578985545062-69928b1d9587";
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
const searchCache = new Map<string, { data: any[], timestamp: number }>();

function generateMockRecipes(flavor: string): any[] {
    const MOOD_MAP: Record<string, string[]> = {
        "sweet": ["Chocolate Cake", "Strawberry Cheesecake", "Vanilla Pudding", "Oatmeal Cookies"],
        "spicy": ["Spicy Chicken Curry", "Chili Con Carne", "Jalapeno Burger", "Hot Wings"],
        "comfort food": ["Macaroni and Cheese", "Beef Stew", "Chicken Soup", "Mashed Potatoes"],
        "energetic": ["Grilled Chicken Bowl", "Steak and Eggs", "Salmon Quinoa", "Protein Smoothie"],
        "focused": ["Avocado Toast", "Grilled Fish Salad", "Berry Bowl", "Green Tea Smoothie"],
        "chill": ["Iced Coffee", "Chamomile Tea", "Fruit Salad", "Veggie Sandwich"],
        "romantic": ["Pasta Carbonara", "Steak Frites", "Chocolate Fondue", "Lobster Risotto"],
        "happy": ["Cheeseburger", "Pepperoni Pizza", "Ice Cream Sundae", "Belgian Waffles"],
        // Spotify
        "fresh salad": ["Greek Salad", "Caesar Salad", "Cobb Salad"],
        "iced coffee": ["Cold Brew", "Caramel Macchiato", "Iced Latte"],
        "italian pasta": ["Spaghetti Bolognese", "Fettuccine Alfredo", "Lasagna"],
        "spicy chicken": ["Buffalo Chicken", "Chicken Vindaloo", "Spicy Tacos"]
    };

    const keywords = MOOD_MAP[flavor.toLowerCase()] || ["Delicious Meal", "Tasty Snack", "Chef's Special"];
    
    return keywords.map((title, index) => ({
        id: `mock-${flavor}-${index}`,
        title: title,
        image: getFallbackImage(title),
        time: "30 min",
        calories: 300 + Math.floor(Math.random() * 500),
        rating: 4.5 + (Math.random() * 0.5),
        sodium: 100
    }));
}

export async function getRecipesByFlavor(flavor: string, isLowSalt: boolean = false) {
    const cacheKey = `${flavor}-${isLowSalt}`;
    const cached = searchCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log(`[Cache Hit] Serving results for: ${flavor}`);
        return cached.data;
    }

    let rawRecipes: any[] = [];
    let apiError = false;

    // Strategy: If specific query, fetch MORE data (parallel pages) to increase match chance.
    // If generic mood, just fetch one random page.
    const isSpecificSearch = flavor && flavor !== "savory" && flavor !== "healthy";
    
    if (isSpecificSearch) {
        // Optimized: Fetch 3 random pages in parallel (~150 items) instead of 5 to speed up response
        const pages = Array.from({ length: 3 }, () => Math.floor(Math.random() * 20) + 1);
        const promises = pages.map(p => fetchFromApi("/recipe-nutri/nutritioninfo", { page: String(p), limit: "50" }));
        
        const results = await Promise.all(promises);
        results.forEach(data => {
            if (data && data.payload && data.payload.data) {
                rawRecipes.push(...data.payload.data);
            } else if (!data) {
                apiError = true;
            }
        });
    } else {
        // Single random page for generic vibes
        const randomPage = Math.floor(Math.random() * 20) + 1;
        const data = await fetchFromApi("/recipe-nutri/nutritioninfo", { page: String(randomPage), limit: "50" });
        if (data && data.payload && data.payload.data) {
            rawRecipes = data.payload.data;
        } else if (!data) {
            apiError = true;
        }
    }

    // Fallback to Mock Data if API fails or returns no matches
    if (rawRecipes.length === 0 || apiError) {
        console.warn(`[Foodoscope] API failed or empty. Generating mock recipes for: ${flavor}`);
        const mocks = generateMockRecipes(flavor);
        if (mocks.length > 0) {
             searchCache.set(cacheKey, { data: mocks, timestamp: Date.now() });
             return mocks;
        }
        return [];
    }
    
    // Step 0: Deduplicate Raw Data
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

    // Step 1: Client-side Filter
    if (isSpecificSearch) {
        const lowerFlavor = flavor.toLowerCase();
        
        // Map Abstract Moods/Vibes to Concrete Food Keywords
        const MOOD_MAP: Record<string, string[]> = {
            "sweet": ["cake", "cookie", "dessert", "sweet", "pudding", "pie", "tart", "brownie", "ice cream", "chocolate"],
            "spicy": ["spicy", "chili", "curry", "hot", "jalapeno", "pepper", "salsa", "masala"],
            "comfort food": ["soup", "stew", "pasta", "cheese", "potato", "burger", "pizza", "fried", "casserole"],
            "energetic": ["chicken", "beef", "steak", "protein", "quinoa", "egg", "tuna", "salmon", "power"],
            "focused": ["salad", "fish", "nut", "berry", "avocado", "green", "tea", "soup", "healthy"],
            "chill": ["ice cream", "smoothie", "drink", "coffee", "tea", "snack", "popcorn", "sandwich"],
            "romantic": ["steak", "pasta", "chocolate", "strawberry", "wine", "fondue", "lobster", "truffle"],
            "happy": ["taco", "burger", "pizza", "waffle", "pancake", "sundae", "nacho", "fries"],
            // Spotify Scenarios
            "fresh salad": ["salad", "green", "lettuce", "vegetable"],
            "iced coffee": ["coffee", "latte", "espresso", "drink"],
            "italian pasta": ["pasta", "spaghetti", "lasagna", "fettuccine", "carbonara"],
            "spicy chicken": ["chicken", "spicy", "curry", "buffalo"]
        };

        // Determine keywords to look for
        let targetKeywords: string[] = MOOD_MAP[lowerFlavor] || [];
        
        // If no direct map, split the query into words (e.g., "Spicy Chicken" -> ["spicy", "chicken"])
        if (targetKeywords.length === 0) {
           targetKeywords = lowerFlavor.split(" ").filter(w => w.length > 2);
        }

        const matched = rawRecipes.filter((r: any) => {
            const t = (r.recipeTitle || r.title || "").toLowerCase();
            // Match if title contains ANY of the target keywords
            return targetKeywords.some(k => t.includes(k));
        });
        
        // CRITICAL: Only return matches. If no matches, return empty (UI handles empty state).
        // Do NOT fall back to random recipes for a specific search.
        rawRecipes = matched;
        
        // Final Fallback: If we searched but found nothing (e.g. niche term), try Mock
        if (rawRecipes.length === 0) {
             console.warn(`[Foodoscope] No API matches for ${flavor}. Using Fallback.`);
             const mocks = generateMockRecipes(flavor);
             if (mocks.length > 0) {
                 searchCache.set(cacheKey, { data: mocks, timestamp: Date.now() });
                 return mocks;
             }
        }
    }

    // Step 2: Map to App format
    let recipes = rawRecipes.map((r: any) => {
        const title = r.recipeTitle || r.title || "Unknown Recipe";
        return {
            id: r.Recipe_id || r._id,
            title: title,
            image: r.img_url || getFallbackImage(title),
            time: "30 min",
            calories: Math.round(parseFloat(r["Energy (kcal)"] || 0)),
            rating: 4.5,
            sodium: parseFloat(r["Sodium, Na (mg)"] || 0)
        };
    });

    // Apply Low Salt Filter
    if (isLowSalt) {
        recipes = recipes.filter((r: any) => r.sodium < 500);
    }
    
    const finalResults = recipes.slice(0, 12);
    
    // Cache the results
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
    const data = await fetchFromApi("/recipe-nutri/nutritioninfo", { 
        "Recipe_id": id,
        "limit": "5" // Fetch a few just in case
    });

    if (data && data.payload && data.payload.data) {
        // Find the specific item in the returned list
        const found = data.payload.data.find((r: any) => 
            String(r.Recipe_id) === String(id) || String(r._id) === String(id)
        );

        if (found) {
             console.log(`[Foodoscope] Found recipe: ${found.recipeTitle}`);
             const title = found.recipeTitle || found.title || "Unknown Recipe";
             return {
                title: title,
                image: found.img_url || getFallbackImage(title),
                time: "30 min",
                calories: Math.round(parseFloat(found["Energy (kcal)"] || 0)),
                description: found.instructions || "Instructions retrieved from Foodoscope API.",
                ingredients: found.ingredients ? found.ingredients.split(",") : ["Ingredients not listed in summary."]
            };
        }
    }
    
    console.warn(`[Foodoscope] ID ${id} not found in API search.`);
    return null;
}



