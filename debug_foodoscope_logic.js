require('dotenv').config();

const API_KEY = process.env.FOODOSCOPE_API_KEY;
const BASE_URL = "https://api.foodoscope.com/recipe2-api";

async function fetchFromApi(endpoint, params = {}) {
    const q = { ...params, _: String(Date.now()) };
    const query = new URLSearchParams(q).toString();
    const url = `${BASE_URL}${endpoint}?${query}`;
    console.log(`fetching: ${url}`);
    try {
        const res = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            console.log(`Failed: ${res.status} ${res.statusText}`);
            console.log(await res.text());
            return null;
        }

        return await res.json();
    } catch (e) {
        console.error("Fetch failed:", e);
        return null;
    }
}

async function checkApiConstraints() {
    console.log("Checking API constraints...");
    console.log("API Key loaded?", !!API_KEY);
    if (API_KEY) console.log("API Key start:", API_KEY.substring(0, 5) + "...");

    // Scenario 1: Exact success case from test_search.js
    console.log("1. sweet + limit=5 (NO PAGE)...");
    const res1 = await fetchFromApi("/recipe-nutri/nutritioninfo", { limit: "5", recipeTitle: "sweet" });
    console.log(`   Result: ${res1?.payload?.data?.length || 0} items`);

    // Scenario 2: sweet + limit=5 + PAGE=1
    console.log("2. sweet + limit=5 + PAGE=1...");
    const res2 = await fetchFromApi("/recipe-nutri/nutritioninfo", { limit: "5", recipeTitle: "sweet", page: "1" });
    console.log(`   Result: ${res2?.payload?.data?.length || 0} items`);

    // Scenario 3: Page only (Original logic)
    console.log("3. PAGE=1 only...");
    const res3 = await fetchFromApi("/recipe-nutri/nutritioninfo", { page: "1", limit: "5" });
    console.log(`   Result: ${res3?.payload?.data?.length || 0} items`);
}

checkApiConstraints();
