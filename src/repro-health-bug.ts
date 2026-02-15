  
import { searchRecipes, fetchRecipesBatch } from "./lib/foodoscope";

async function testHealthGoals() {
    console.log("---- Testing Health Goal Queries ----");

    const goals = [
        "High Protein",
        "Vegan",
        "Keto",
        "Low Sodium",
        // "Gluten Free" // Foodoscope might not support this as a flavor string
    ];

    for (const goal of goals) {
        console.log(`\nTesting goal: "${goal}"`);
        console.time(`Search ${goal}`);

        try {
            // Simulate what the API route does: pass goal as goal list
            // Goals in UI: "weight-loss", "keto", "high-protein", "low-sodium", "vegan", "gluten-free"
            const goalId = goal.toLowerCase().replace(" ", "-");
            const recipes: any[] = await searchRecipes("", [goalId]);
            console.timeEnd(`Search ${goal}`);

            if (recipes.length === 0) {
                console.warn(`⚠️ No recipes found for "${goal}".`);
            } else {
                console.log(`✅ Found ${recipes.length} recipes for "${goal}".`);
                console.log("First recipe title:", recipes[0].title);

                // Inspect first recipe for relevance
                const r = recipes[0];
                if (goal === "High Protein") {
                    console.log(`   Protein: ${r.macros?.protein}g`);
                } else if (goal === "Vegan") {
                    // Check if title or ingredients imply vegan?
                    // The mapped recipe has diet flags? No, only macros and sodium were mapped in foodoscope.ts
                    // Wait, foodoscope.ts map function:
                    // macros: { ... }
                    // It doesn't seem to map "diet" flags.
                    // But results/page.tsx uses `recipe.diet?.vegan`. 
                    // Let's check foodoscope.ts map again.
                }
            }
        } catch (error) {
            console.error(`❌ Failed to search for "${goal}":`, error);
        }
    }
}

testHealthGoals();
