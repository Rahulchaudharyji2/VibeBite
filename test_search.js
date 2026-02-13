require('dotenv').config();

const API_KEY = process.env.FOODOSCOPE_API_KEY;
const BASE_URL = "https://api.foodoscope.com/recipe2-api";

async function testSearch(query) {
    if (!API_KEY) {
        console.error("No API Key");
        return;
    }

    const testParams = ['searchText', 'q', 'query', 'title', 'keywords'];

    for (const param of testParams) {
        const params = new URLSearchParams({
            [param]: query,
            'limit': '1'
        });

        const url = `${BASE_URL}/recipe-nutri/nutritioninfo?${params.toString()}`;
        console.log(`Testing param '${param}': ${url}`);

        try {
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                if(data.payload?.data?.length > 0) {
                    console.log(`  Result for '${param}': ${data.payload.data[0].recipeTitle}`);
                } else {
                    console.log(`  No results for '${param}'`);
                }
            }
        } catch (e) {
            console.error("Failed:", e);
        }
    }
}

testSearch("sweet");
