
const API_KEY = process.env.FOODOSCOPE_API_KEY || "";
const BASE_URL = "https://api.foodoscope.com";

// Scientific Molecular Map (Expanded Scientific Lookup)
// Sources: FlavorDB, PubMed (Nutritional Psychiatry), Food Pairing Theory
const MOLECULAR_PAIRINGS: Record<string, string[]> = {
    // --- MOODS (Based on Neurotransmitters & Compounds) ---

    // ⚡ Energetic / Alert (Dopamine & Norepinephrine boosters)
    // Compounds: Citral, Limonene, Capsaicin, Caffeine
    "energetic": ["Lemon", "Ginger", "Peppermint", "Rosemary", "Chili", "Grapefruit", "Green Tea", "Dark Chocolate", "Spinach"],
    "high energy": ["Lemon", "Ginger", "Peppermint", "Rosemary", "Chili", "Grapefruit"],

    // 🧘 Relaxed / Chill (GABA & Serotonin modulation)
    // Compounds: Linalool, Magnesium, Tryptophan
    "relaxed": ["Lavender", "Chamomile", "Honey", "Oat", "Cherry", "Banana", "Almond", "Sweet Potato", "Warm Milk"],
    "chill": ["Lavender", "Chamomile", "Honey", "Oat", "Cherry", "Banana", "Almond", "Sweet Potato"],

    // 😔 Melancholic / Sad (Serotonin & Omega-3 boosters)
    // Compounds: Omega-3 Fatty Acids, Folate, Selenium
    "melancholic": ["Salmon", "Walnut", "Dark Chocolate", "Berry", "Spinach", "Avocado", "Turmeric", "Yogurt"],
    "sad": ["Salmon", "Walnut", "Dark Chocolate", "Berry", "Spinach", "Avocado"],

    // 😫 Stressed / Anxious (Cortisol reduction)
    // Compounds: Vitamin C, Magnesium, L-Theanine
    "stressed": ["Orange", "Blueberry", "Avocado", "Almond", "Spinach", "Salmon", "Chamomile", "Asparagus"],
    "anxious": ["Orange", "Blueberry", "Avocado", "Almond", "Spinach", "Salmon"],

    // 😊 Happy (Endorphin & Serotonin boosters)
    // Compounds: Phenylethylamine, Vanillin, Curcumin
    "happy": ["Strawberry", "Vanilla", "Peach", "Coconut", "Mango", "Banana", "Coffee", "Chili"],

    // ❤️ Romantic (Aphrodisiacs / Vasodilators)
    // Compounds: Capsaicin, Zinc, Phenylethylamine
    "romantic": ["Strawberry", "Chocolate", "Oyster", "Vanilla", "Chili", "Fig", "Pomegranate", "Red Wine"],

    // 🧠 Focused / Productive (Cognitive enhancers)
    // Compounds: Flavonoids, Caffeine, Choline
    "focused": ["Salmon", "Walnut", "Blueberry", "Matcha", "Coffee", "Egg", "Broccoli", "Pumpkin Seed"],

    // --- HEALTH GOALS ---

    // 🥑 Keto (High Fat, Low Carb)
    "keto": ["Avocado", "Salmon", "Egg", "Butter", "Steak", "Cheese", "Olive Oil", "Cauliflower", "Bacon"],

    // 🌿 Vegan (Plant-based High Protein)
    "vegan": ["Tofu", "Lentil", "Chickpea", "Quinoa", "Spinach", "Mushrooms", "Almond", "Seitan", "Tempeh"],

    // 🥦 Low Calorie / Weight Loss (High Fiber, High Volume)
    "low calorie": ["Cucumber", "Celery", "Watermelon", "Zucchini", "Leafy Greens", "Grapefruit", "Berries"],

    // 💪 High Protein (Muscle Building)
    "high protein": ["Chicken Breast", "Tuna", "Greek Yogurt", "Egg White", "Turkey", "Cottage Cheese", "Lean Beef"],

    // 🌾 Gluten Free
    "gluten free": ["Rice", "Quinoa", "Potato", "Corn", "Buckwheat", "Almond Flour", "Coconut Flour"],

    // --- CONTEXTUAL ---
    "party": ["Pizza", "Nachos", "Wings", "Chips", "Beer", "Soda", "Tacos"],
    "comfort": ["Mac and Cheese", "Soup", "Stew", "Mashed Potato", "Pie", "Pasta"],
    "breakfast": ["Pancake", "Egg", "Oatmeal", "Toast", "Bacon", "Waffle", "Smoothie"],

    // --- TASTE PROFILES (For direct queries like "Spicy") ---
    "spicy": ["Chili", "Jalapeno", "Cayenne", "Paprika", "Garlic", "Sriracha", "Pepper", "Cumin", "Curry"],
    "sweet": ["Sugar", "Honey", "Maple Syrup", "Vanilla", "Berry", "Chocolate", "Caramel"],
    "salty": ["Sea Salt", "Soy Sauce", "Cheese", "Olive", "Bacon", "Capers", "Anchovy"],
    "bitter": ["Coffee", "Dark Chocolate", "Kale", "Arugula", "Grapefruit", "Turmeric"],
    "sour": ["Lemon", "Lime", "Vinegar", "Yogurt", "Pickle", "Tamarind"]
};

// Map abstract moods to concrete ingredients that FlavorDB understands
const MOOD_TO_INGREDIENT_MAP: Record<string, string> = {
    "chill": "Mint",
    "relaxed": "Chamomile",
    "energetic": "Lemon",
    "happy": "Vanilla",
    "romantic": "Strawberry",
    "melancholic": "Dark Chocolate",
    "stressed": "Orange",
    "focused": "Coffee"
};

export async function getMolecularPairings(flavor: string): Promise<string[]> {
    const lowerFlavor = flavor.toLowerCase();

    // Map abstract mood to a concrete ingredient for the API query
    // e.g. "Chill" -> "Mint" (which allows FlavorDB to return "Mint" pairings like Chocolate, Lime)
    const apiQueryIngredient = MOOD_TO_INGREDIENT_MAP[lowerFlavor] || lowerFlavor;

    // 1. Try Real API (Scientific Flavor Analysis)
    try {
        const url = `${BASE_URL}/ingredients/flavor/${apiQueryIngredient}`;
        console.log(`[FlavorDB] Fetching molecular matches for: ${lowerFlavor} (Mapped to: ${apiQueryIngredient})`);

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (res.ok) {
            const data = await res.json();
            // Assuming API returns { ingredients: ["Citral", ...] } or similar
            // Adjust based on actual response structure if needed
            if (data.ingredients && Array.isArray(data.ingredients)) {
                console.log(`[FlavorDB] Found: ${data.ingredients.join(", ")}`);
                return data.ingredients;
            }
        } else {
            // 404 is expected for complex dishes or if API is down.
            // We use a local molecular database as a robust fallback, so this is NOT an error.
            console.log(`[FlavorDB] No direct API match for '${apiQueryIngredient}'. Using internal molecular database.`);
        }
    } catch (e) {
        console.warn("FlavorDB API failed, switching to Local Molecular Database.", e);
    }

    // 2. Scientific Fallback (Local)
    // Return molecular matches if specific mood/goal is found
    if (MOLECULAR_PAIRINGS[lowerFlavor]) {
        return MOLECULAR_PAIRINGS[lowerFlavor];
    }

    // 3. Composite/Smart Splitting (e.g. "Keto Vegan" -> Merge sets)
    const compounds: string[] = [];
    const parts = lowerFlavor.split(/[ ,]+/);
    for (const part of parts) {
        if (MOLECULAR_PAIRINGS[part]) {
            compounds.push(...MOLECULAR_PAIRINGS[part]);
        }
    }

    if (compounds.length > 0) {
        return Array.from(new Set(compounds));
    }

    // 4. Default: Return original to let standard search handle it
    return [flavor];
}
