const https = require('https');

const endpoints = [
    "https://cosylab.iiitd.edu.in/flavordb/entities?t=Vanilla",
    "https://cosylab.iiitd.edu.in/flavordb/api/entities?t=Vanilla",
    "https://cosylab.iiitd.edu.in/flavordb/search?q=Vanilla",
    "https://cosylab.iiitd.edu.in/flavordb/food_pairing_analysis/Vanilla"
];

function probe(url) {
    const req = https.get(url, (res) => {
        console.log(`Probing ${url} -> Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const contentType = res.headers['content-type'];
                console.log(`Type: ${contentType}`);
                if (contentType.includes('json')) {
                    console.log(`Body: ${data.substring(0, 200)}...`);
                }
            });
        }
    });

    req.on('error', (e) => {
        console.error(`Error probing ${url}:`, e.message);
    });
}

endpoints.forEach(probe);
