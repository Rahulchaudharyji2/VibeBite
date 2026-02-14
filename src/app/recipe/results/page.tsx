"use client";

export const dynamic = "force-dynamic";


import { motion } from "framer-motion";
import { ArrowLeft, Clock, Flame, Star, ShoppingBag, Utensils, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useVibe } from "@/lib/vibe-context";

import { Suspense } from "react";

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { currentVibe, setVibe, setSong } = useVibe(); // Added setSong

    // URL Params (Initial Load)
    const urlMood = searchParams.get("mood");
    const goals = searchParams.get("goals");
    const query = searchParams.get("query");
    const source = searchParams.get("source");

    // Active Mood: Global Context takes precedence if active (not neutral), else URL
    const activeMood = currentVibe !== "neutral" ? currentVibe : urlMood;

    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSong, setCurrentSong] = useState<any>(null);

    const [displayTitle, setDisplayTitle] = useState("");

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                let apiQuery = query;
                let apiMood = activeMood;

                // Handle Spotify Source
                if (source === "spotify") {
                    let apiUrl = "/api/spotify/current-vibe";
                    // If there's a user query (entered in mood page), pass it to the API
                    if (query) {
                        apiUrl += `?q=${encodeURIComponent(query)}`;
                    }

                    const vibeRes = await fetch(apiUrl);
                    const vibeData = await vibeRes.json();

                    if (vibeData) {
                        // SYNC GLOBAL PLAYER
                        setCurrentSong(vibeData.song); // Local state for immediate UI
                        setScientificData(vibeData.scientific_analysis); // Store analysis data
                        if (setSong) setSong(vibeData.song); // Global context for MusicPlayer
                        if (setVibe) setVibe(vibeData.vibe.toLowerCase()); // Sync Global Vibe

                        // FORCE Override: Use the API's curated query (e.g. "Energetic Food") 
                        // instead of the song title (e.g. "Shape of You")
                        apiQuery = vibeData.query;
                        apiMood = vibeData.vibe.toLowerCase();

                        setDisplayTitle(`Based on "${vibeData.song.title}"`);
                    }
                }
                // Handle YouTube Source
                else if (source === "youtube") {
                    let apiUrl = "/api/youtube/current-vibe";
                    if (query) {
                        apiUrl += `?q=${encodeURIComponent(query)}`;
                    }

                    const vibeRes = await fetch(apiUrl);
                    const vibeData = await vibeRes.json();

                    if (vibeData) {
                        setCurrentSong(vibeData.song);
                        setScientificData(vibeData.scientific_analysis);
                        if (setSong) setSong(vibeData.song);
                        if (setVibe) setVibe(vibeData.vibe.toLowerCase());

                        apiQuery = vibeData.query;
                        apiMood = vibeData.vibe.toLowerCase();

                        setDisplayTitle(`Based on "${vibeData.song.title}"`);
                    }
                }

                if (currentVibe !== "neutral") {
                    setDisplayTitle(`${currentVibe.charAt(0).toUpperCase() + currentVibe.slice(1)} Vibes`);
                } else {
                    setDisplayTitle(
                        activeMood ? `${activeMood.charAt(0).toUpperCase() + activeMood.slice(1)} Vibes`
                            : goals ? "Healthy Picks"
                                : query ? `Results for "${query}"`
                                    : "Recommended For You"
                    );
                }

                let url = `/api/recipes`;
                const params = new URLSearchParams();
                if (apiMood) params.append("mood", apiMood);
                if (apiQuery) params.append("query", apiQuery);
                if (goals) params.append("goals", goals);

                const res = await fetch(`${url}?${params.toString()}`);
                const data = await res.json();
                setRecipes(data.recipes || []);
            } catch (error) {
                console.error("Failed to fetch recipes", error);
                setRecipes([]);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [activeMood, goals, query, source, currentVibe, setSong, setVibe]); // Added setSong dependency

    const [scientificData, setScientificData] = useState<any>(null); // State for analysis

    return (
        <div className="min-h-screen p-6 transition-colors duration-500">
            <div className="max-w-7xl mx-auto mt-12 pb-24">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-3 glass-card rounded-full hover:bg-white/10 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-3xl font-bold font-display text-white drop-shadow-lg">{displayTitle}</h1>
                    </div>

                    {/* Spotify/YouTube Now Playing & Scientific Analysis */}
                    {(source === "spotify" || source === "youtube") && currentSong && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Now Playing Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`glass-card p-4 rounded-2xl flex items-center gap-4 ${source === 'youtube' ? 'border-red-500/30' : 'border-[#1DB954]/30'} bg-black/40`}
                            >
                                {currentSong.cover && <img src={currentSong.cover} alt={currentSong.title} className="w-20 h-20 rounded-xl shadow-lg animate-spin-slow" />}
                                <div>
                                    <div className={`text-xs ${source === 'youtube' ? 'text-red-500' : 'text-[#1DB954]'} font-bold uppercase tracking-wider mb-1 flex items-center gap-2`}>
                                        <span className={`w-2 h-2 ${source === 'youtube' ? 'bg-red-500' : 'bg-[#1DB954]'} rounded-full animate-pulse`} /> Now Playing
                                    </div>
                                    <div className="font-bold text-xl leading-tight text-white">{currentSong.title}</div>
                                    <div className="text-sm text-gray-400">{currentSong.artist}</div>
                                </div>
                            </motion.div>

                            {/* Scientific Transparency Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card p-4 rounded-2xl border-purple-500/30 bg-purple-900/10"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="text-xs text-purple-400 font-bold uppercase tracking-wider">Scientific Analysis</div>
                                    <FlaskConical size={16} className="text-purple-400" />
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-black/20 rounded-lg p-2">
                                        <div className="text-xs text-gray-400">BPM</div>
                                        <div className="font-mono text-lg font-bold text-white">{scientificData?.bpm || "N/A"}</div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-2">
                                        <div className="text-xs text-gray-400">Energy</div>
                                        <div className="font-mono text-lg font-bold text-[#C6FF33]">
                                            {scientificData?.energy > 0.8 ? "High" : scientificData?.energy > 0.5 ? "Med" : "Low"}
                                        </div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-2">
                                        <div className="text-xs text-gray-400">Detected</div>
                                        <div className="font-mono text-lg font-bold text-purple-300 truncate">
                                            {scientificData?.trigger?.split('(')[0].trim() || activeMood || "Vibe"}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-gray-400 text-center border-t border-white/5 pt-2">
                                    Matched <span className="text-white font-bold">{scientificData?.compounds?.join(", ") || "compounds"}</span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-64 glass-card rounded-[2rem] animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && recipes.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h2 className="text-2xl font-bold mb-2">No Recipes Found</h2>
                        <p className="text-gray-400 mb-6">We couldn't find any recipes matching your vibe from the API.</p>
                        <button onClick={() => router.back()} className="px-6 py-3 bg-[var(--color-neon-lime)] text-black rounded-full font-bold hover:opacity-90 transition-opacity">
                            Try Different Keywords
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recipes.map((recipe, index) => (
                        <motion.div
                            key={recipe.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={{
                                    pathname: `/recipe/${recipe.id}`,
                                    query: {
                                        title: recipe.title,
                                        image: recipe.image,
                                        calories: recipe.calories,
                                        time: recipe.time,
                                        rating: recipe.rating,
                                        sodium: recipe.sodium
                                    }
                                }}
                                className="block group"
                            >
                                <div className="glass-card rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                                    <div className="h-64 relative overflow-hidden bg-gray-800 shrink-0">
                                        <img
                                            src={recipe.image || "/placeholder-recipe.jpg"}
                                            alt={recipe.title}
                                            onError={(e) => {
                                                e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"; // Fallback only on error
                                            }}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        {/* Status Badges */}
                                        <div className="absolute top-4 left-4 flex flex-col gap-1 items-start z-10">
                                            {recipe.diet?.vegan && <span className="px-2 py-0.5 bg-green-500/90 text-white text-[10px] font-bold rounded-full shadow-lg backdrop-blur-md font-mono">VEGAN</span>}
                                            {recipe.macros?.protein > 20 && <span className="px-2 py-0.5 bg-blue-500/90 text-white text-[10px] font-bold rounded-full shadow-lg backdrop-blur-md font-mono">HIGH PROTEIN</span>}
                                        </div>
                                        {recipe.rating && (
                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold text-yellow-400">
                                                <Star size={12} fill="currentColor" /> {recipe.rating}
                                            </div>
                                        )}
                                        {/* Scientific Match Badge */}
                                        {recipe.scientificMatch && (
                                            <div className="absolute bottom-4 left-4 bg-[var(--color-neon-lime)] text-black px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-lg">
                                                <FlaskConical size={12} /> {recipe.scientificMatch} Match
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-bold mb-3 line-clamp-2">{recipe.title}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 mt-auto">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {recipe.time || "30 min"}</span>
                                            <span className="flex items-center gap-1"><Flame size={14} /> {recipe.calories || "N/A"} kcal</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mb-4 font-mono">
                                            Sodium: {recipe.sodium}mg {recipe.sodium < 100 && <span className="text-green-400 font-bold ml-1">(Likely Low Salt)</span>}
                                        </div>
                                        <div className="flex gap-2 mt-auto">
                                            <button className="flex-1 py-3 bg-white text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                                                <Utensils size={16} /> Recipe
                                            </button>
                                            <button className="flex-1 py-3 bg-[var(--color-neon-lime)] text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#d4ff66] transition-colors">
                                                <ShoppingBag size={16} /> Order
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function RecipeResults() {
    return (
        <Suspense fallback={<div className="min-h-screen mesh-gradient flex items-center justify-center text-white">Loading...</div>}>
            <SearchResultsContent />
        </Suspense>
    );
}
