require('dotenv').config();

const API_KEY = process.env.FOODOSCOPE_API_KEY;
const BASE_URL = "https://api.foodoscope.com/recipe2-api";

async function probe() {
    if (!API_KEY) {
        console.error("No API Key");
        return;
    }

    const endpoints = [
        "/search",
        "/recipes/search",
        "/recipe/search",
        "/recipe-nutri/search",
        "/recipe-nutri/recipes",
        "/recipes",
        "/recipe/title",
        "/recipe-nutri/title"
    ];

    for (const ep of endpoints) {
        const url = `${BASE_URL}${ep}?searchText=sweet&limit=1`;
        console.log(`Probing: ${url}`);
        try {
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`  Status: ${res.status}`);
            if (res.ok) {
                const text = await res.text();
                // Check if it looks like a recipe list
                console.log(`  Content: ${text.substring(0, 100)}...`);
            }
        } catch (e) {
            console.log(`  Failed: ${e.message}`);
        }
    }
}

probe();
