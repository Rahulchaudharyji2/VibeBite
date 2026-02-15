const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

// 1. Search YouTube Data API
export async function searchTracks(query: string) {
    if (!YOUTUBE_API_KEY) {
        console.error("❌ Missing YOUTUBE_API_KEY in .env.local");
        return null;
    }

    try {
        // Search for videos of type 'video' with 'music' category inference
        // We append "audio" or "song" to query to bias towards music results
        const searchUrl = `${YOUTUBE_API_URL}/search?part=snippet&q=${encodeURIComponent(query + " song")}&type=video&videoCategoryId=10&maxResults=1&key=${YOUTUBE_API_KEY}`;

        const res = await fetch(searchUrl);
        if (!res.ok) {
            console.error(`[YouTube API Error] Status: ${res.status}`);
            return null;
        }

        const data = await res.json();
        const item = data.items?.[0];

        if (!item) return null;

        const snippet = item.snippet;
        return {
            id: item.id.videoId,
            title: snippet.title, // YouTube titles often have "Artist - Song", we might need to parse, but raw is fine.
            artist: snippet.channelTitle, // This is the Channel Name (e.g., "Ed Sheeran")
            albumImage: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
            songUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            previewUrl: "" // YouTube doesn't give preview MP3s conveniently
        };

    } catch (error) {
        console.error("YouTube Search Error:", error);
        return null;
    }
}

// 2. Mathematical Mood Simulation (Since YouTube has no Audio Features)
// This is critical: We MUST generate consistent mood/energy for the app to work.
export async function getAudioFeatures(id: string) {
    return generateSimulatedFeatures(id);
}

function generateSimulatedFeatures(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0;
    }

    const seed = Math.abs(hash) / 2147483647;

    const energy = 0.3 + (seed * 0.7);
    const valence = 0.2 + ((seed * 12345 % 1) * 0.8);
    const tempo = 80 + (Math.floor(seed * 100));

    let mood = "Chill";
    if (energy > 0.6 && valence > 0.6) mood = "Energetic";
    else if (energy < 0.4 && valence < 0.4) mood = "Melancholic";
    else if (energy > 0.6 && valence < 0.4) mood = "Stressed";
    else if (energy < 0.5 && valence > 0.6) mood = "Happy";
    else if (energy < 0.5) mood = "Relaxed";

    return { bpm: Math.round(tempo), energy, valence, mood };
}

// 3. Random Discovery (Simulated via random search terms)
export async function getNowPlaying() {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));

    // Search for a random letter to get a random popular song
    const track = await searchTracks(`song starting with ${randomChar}`);

    if (!track) return null;

    const features = await getAudioFeatures(track.id);

    return {
        ...track,
        ...features,
        isPlaying: true
    };
}

// 4. Get User History (Latest Liked Videos)
export async function getUserHistory(accessToken: string) {
    try {
        const url = `${YOUTUBE_API_URL}/videos?part=snippet&myRating=like&maxResults=1`;
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json"
            }
        });

        if (!res.ok) {
            console.error(`[YouTube History] API Error: ${res.status}`);
            return null;
        }

        const data = await res.json();
        const item = data.items?.[0];

        if (!item) return null;

        return {
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            cover: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
            youtubeId: item.id
        };
    } catch (error) {
        console.error("[YouTube History] Error:", error);
        return null;
    }
}
