async function testLocalApi() {
    const baseUrl = "http://localhost:3000/api/recipes";
    
    const tests = [
        { name: "Focused Mood", url: `${baseUrl}?mood=focused` },
        { name: "Spotify Query (Italian Pasta)", url: `${baseUrl}?query=Italian%20Pasta` },
        { name: "Happy Mood", url: `${baseUrl}?mood=happy` }
    ];

    for (const t of tests) {
        console.log(`Testing: ${t.name}`);
        try {
            const res = await fetch(t.url);
            const data = await res.json();
            const count = data.recipes?.length || 0;
            console.log(`  Hits: ${count}`);
            if (count > 0) {
                console.log(`  First: ${data.recipes[0].title}`);
            } else {
                console.log("  NO RESULTS");
            }
        } catch (e) {
            console.error(`  Failed: ${e.message}`);
        }
    }
}

testLocalApi();
