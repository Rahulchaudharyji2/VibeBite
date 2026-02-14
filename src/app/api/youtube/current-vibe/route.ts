import { NextResponse } from "next/server";
import { searchTracks, getAudioFeatures } from "@/lib/youtube";
import { getMolecularPairings } from "@/lib/flavordb";

// No hardcoded mocks. We will rely on live search or a generic fallback if API fails completely.
async function getFallbackTrack() {
    // Fallback: Use a generic search if no query provided
    try {
        const track = await searchTracks("Vibe"); // Generic search
        if (track) {
            const audioFeatures = await getAudioFeatures(track.id);
            return {
                song: {
                    title: track.title,
                    artist: track.artist,
                    cover: track.albumImage,
                    youtubeId: track.id,
                    previewUrl: track.previewUrl
                },
                vibe: audioFeatures?.mood || "Chill",
                query: "Comfort Food", // Generic fallback
                scientific_analysis: {
                    bpm: audioFeatures?.bpm || 100,
                    energy: audioFeatures?.energy || 0.5,
                    valence: audioFeatures?.valence || 0.5,
                    trigger: "Fallback Vibe"
                }
            };
        }
    } catch (e) {
        console.error("Fallback search failed:", e);
    }

    // Absolute last resort if everything fails (API down, etc.)
    return {
        song: {
            title: "Unknown Track",
            artist: "Unknown Artist",
            cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop", // Fallback image
            previewUrl: ""
        },
        vibe: "Chill",
        query: "Comfort Food",
        scientific_analysis: { bpm: 0, energy: 0, valence: 0, trigger: "System Error" }
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // Allow testing with ?q=SongName

    if (query) {
        // Step 1: Search Track
        const track = await searchTracks(query);

        if (track) {
            // Step 2: Get Audio Features (Scientific Mood)
            const audioFeatures = await getAudioFeatures(track.id);
            const mood = audioFeatures?.mood || "Chill"; // Default fallback if features fail

            // Step 3: Get Molecular Compounds for this mood
            const compounds = await getMolecularPairings(mood);

            return NextResponse.json({
                song: {
                    title: track.title,
                    artist: track.artist,
                    cover: track.albumImage || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop",
                    youtubeId: track.id,
                    previewUrl: track.previewUrl
                },
                vibe: mood,
                query: `${mood} Food`,
                // Transparency Data
                scientific_analysis: {
                    bpm: audioFeatures?.bpm,
                    energy: audioFeatures?.energy,
                    valence: audioFeatures?.valence,
                    trigger: `${mood} (BPM: ${audioFeatures?.bpm})`,
                    compounds: compounds.slice(0, 3) // Top 3 compounds
                }
            });
        }
    }

    // Default to dynamic fallback if no query or search fails
    return NextResponse.json(await getFallbackTrack());
}
