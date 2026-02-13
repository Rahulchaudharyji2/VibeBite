require('dotenv').config();

const API_KEY = process.env.FOODOSCOPE_API_KEY;
const BASE_URL = "https://api.foodoscope.com/recipe2-api";

async function testDetails() {
    // 1. Get a random recipe to test
    const searchUrl = `${BASE_URL}/recipe-nutri/nutritioninfo?page=1&limit=1`;
    const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const searchData = await searchRes.json();
    const recipe = searchData.payload?.data?.[0];

    if(!recipe) {
        console.error("No recipe found");
        return;
    }

    const id = recipe.Recipe_id || recipe._id;
    console.log(`Testing ID: ${id}`);
    console.log(`Title: ${recipe.recipeTitle || recipe.title}`);

    // Check fields on the 'summary' object first
    console.log("--- Summary Object Fields ---");
    console.log("Has 'ingredients'?",  !!recipe.ingredients);
    console.log("Has 'instructions'?", !!recipe.instructions);
    console.log("Has 'url'?", !!recipe.url);
    
    // 2. Fetch specific details (if different from summary)
    const params = new URLSearchParams({ "Recipe_id": String(id), "limit": "1" });
    const detailUrl = `${BASE_URL}/recipe-nutri/nutritioninfo?${params.toString()}`;
    const res = await fetch(detailUrl, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    const data = await res.json();
    
    const found = data.payload?.data?.[0];
    if (found) {
        console.log("--- Detail Object Fields ---");
        console.log("Has 'ingredients'?", !!found.ingredients);
        console.log("Ingredients value:", found.ingredients); // Print actual value if any
        console.log("Has 'instructions'?", !!found.instructions); 
        console.log("Instructions value:", found.instructions);
        console.log("Has 'url'?", !!found.url);
        console.log("URL value:", found.url);
    }
}

testDetails();
