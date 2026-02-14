const https = require('https');

const clientId = "8efe801a68fb4e7b88916d2aecec4f3c";
const clientSecret = "3c318aa66a644a619d8a1bb87b57f54a";

async function getSpotifyToken() {
    console.log("Fetching Spotify Token...");
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    return new Promise((resolve, reject) => {
        const req = https.request('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const token = JSON.parse(data).access_token;
                    console.log("Token obtained successfully.");
                    resolve(token);
                } else {
                    console.error(`Token Fetch Failed: ${res.statusCode}`);
                    console.error(data);
                    reject(new Error("Token failed"));
                }
            });
        });

        req.write('grant_type=client_credentials');
        req.end();
    });
}

async function searchTrack(token) {
    console.log("\nSearching for track 'Shape of You'...");
    return new Promise((resolve, reject) => {
        const req = https.request('https://api.spotify.com/v1/search?q=Shape%20of%20You&type=track&limit=1', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Search Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    const parsed = JSON.parse(data);
                    const track = parsed.tracks?.items?.[0];
                    if (track) {
                        console.log(`Found Track: ${track.name} by ${track.artists[0].name}`);
                    } else {
                        console.log("No track found in response.");
                    }
                } else {
                    console.error("Search Failed. Response Body:");
                    console.error(data);
                }
            });
        });
        req.end();
    });
}

(async () => {
    try {
        const token = await getSpotifyToken();
        await searchTrack(token);
    } catch (e) {
        console.error("Test failed:", e.message);
    }
})();
