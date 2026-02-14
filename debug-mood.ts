
const fs = require('fs');
const path = require('path');

// Load env
try {
    const envPath = path.resolve(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line: string) => {
        const [key, value] = line.split('=');
        if (key && value) {
            let val = value.trim();
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1);
            }
            process.env[key.trim()] = val;
        }
    });
} catch (e) {
    console.log("Could not load .env", e);
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "spotify81.p.rapidapi.com";

console.log("RAPIDAPI_KEY Loaded:", !!RAPIDAPI_KEY);
console.log("RAPIDAPI_HOST:", RAPIDAPI_HOST);

async function searchTracks(query: string) {
    if (!RAPIDAPI_KEY) {
        console.error("NO API KEY FOUND");
        return null;
    }
    try {
        console.log(`Searching API: https://${RAPIDAPI_HOST}/search?q=${encodeURIComponent(query)}&type=tracks&limit=1`);
        const res = await fetch(`https://${RAPIDAPI_HOST}/search?q=${encodeURIComponent(query)}&type=tracks&limit=1`, {
            headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST }
        });

        console.log("Search Status:", res.status);
        if (!res.ok) {
            console.log("Search Error Body:", await res.text());
            return null;
        }

        const data = await res.json();
        // console.log("Search Data:", JSON.stringify(data, null, 2));

        const item = data.tracks?.items?.[0] || data[0];
        const track = item?.data || item;
        return track ? { id: track.id, name: track.name } : null;
    } catch (e) { console.error("Search Exception:", e); return null; }
}

async function getAudioFeatures(id: string) {
    if (!RAPIDAPI_KEY) return null;
    try {
        console.log(`Fetching Features for ID: ${id}`);
        const res = await fetch(`https://${RAPIDAPI_HOST}/audio_features?ids=${id}`, {
            headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST }
        });
        console.log("Features Status:", res.status);
        const data = await res.json();
        // console.log("RAW FEATURES:", JSON.stringify(data, null, 2));
        return data.audio_features?.[0];
    } catch (e) { console.error("Features Exception:", e); return null; }
}

async function run() {
    console.log("Starting Debug Run...");
    console.log("Searching for Starboy...");
    const track = await searchTracks("Starboy");
    if (track) {
        console.log(`Found: ${track.name} (${track.id})`);
        const features = await getAudioFeatures(track.id);
        if (features) {
            console.log("Energy:", features.energy);
            console.log("Valence:", features.valence);
            console.log("Tempo:", features.tempo);

            // Replicate Logic
            const { energy, valence } = features;
            let mood = "Chill";
            if (energy > 0.6 && valence > 0.6) mood = "Energetic";
            else if (energy < 0.4 && valence < 0.4) mood = "Melancholic";
            else if (energy > 0.6 && valence < 0.4) mood = "Stressed";
            else if (energy < 0.5 && valence > 0.6) mood = "Happy";
            else if (energy < 0.5) mood = "Relaxed";

            console.log("CALCULATED MOOD:", mood);
        } else {
            console.log("No features found.");
        }
    } else {
        console.log("Track not found (Search failed).");
    }
}

run();
