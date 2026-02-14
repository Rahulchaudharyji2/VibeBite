require('dotenv').config({ path: '.env.local' }); // Loads from your Next.js env file

async function testFlavorDB() {
    const apiKey = process.env.FOODOSCOPE_API_KEY;
    
    if (!apiKey) {
        console.error("❌ No FOODOSCOPE_API_KEY found! Make sure it's in .env.local");
        return;
    }

    const urls = [
        "http://cosylab.iiitd.edu.in:6969/flavordb/food/by-alias?food_pair=vanilla",
        "http://cosylab.iiitd.edu.in:6969/flavordb/food/by-alias?food_pair=Vanilla"
    ];

    for (const url of urls) {
        console.log(`\n--- Fetching: ${url} ---`);
        try {
            const res = await fetch(url, {
                headers: { 
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${apiKey}` // <-- The missing key!
                }
            });
            console.log(`Status: ${res.status} ${res.statusText}`);
            
            const data = await res.json();
            // Print the first 400 characters of the exact JSON structure
            console.log("JSON Output:", JSON.stringify(data, null, 2).substring(0, 400));
        } catch (e) {
            console.error("Error:", e.message);
        }
    }
}

testFlavorDB();