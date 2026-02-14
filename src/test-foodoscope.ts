import { getRecipesByFlavor, getRecipeById } from "./lib/foodoscope";

async function runTest() {
    console.log("---- Starting Foodoscope Integration Test (Optimized) ----");

    // Test 1: Search by flavor
    const flavor = "lemon"; // using a flavor known to work in FlavorDB
    console.log(`\nTesting search for flavor: "${flavor}"`);
    console.time("Search Time");

    try {
        const recipes = await getRecipesByFlavor(flavor);
        console.timeEnd("Search Time");

        if (recipes.length === 0) {
            console.warn("⚠️ No recipes found. Check API quota or flavor relevance.");
        } else {
            console.log(`✅ Found ${recipes.length} recipes.`);
            console.log("First recipe:", JSON.stringify(recipes[0].title, null, 2));

            // Test 2: Get Recipe by ID
            const firstId = String(recipes[0].id);
            console.log(`\nTesting getRecipeById for ID: ${firstId}`);
            console.time("Detail Time");

            const details = await getRecipeById(firstId);
            console.timeEnd("Detail Time");

            if (!details) {
                console.error("❌ Failed to fetch details for valid ID:", firstId);
            } else {
                console.log("✅ Successfully fetched details.");
                console.log("Details title:", details.title);
            }
        }

    } catch (error) {
        console.error("❌ Test failed with error:", error);
    }
}

runTest();
