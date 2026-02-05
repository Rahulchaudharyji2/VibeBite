"use client";

export const dynamic = "force-dynamic";


import { motion } from "framer-motion";
import { ArrowLeft, Clock, Flame, Star, ShoppingBag, Utensils } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecipeResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const mood = searchParams.get("mood");
  const goals = searchParams.get("goals");
  const query = searchParams.get("query");
  const source = searchParams.get("source");
  
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState<any>(null);

  const [displayTitle, setDisplayTitle] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let apiQuery = query;
        let apiMood = mood;
        
        // Handle Spotify Source
        if (source === "spotify") {
            const vibeRes = await fetch("/api/spotify/current-vibe");
            const vibeData = await vibeRes.json();
            if (vibeData) {
                setCurrentSong(vibeData.song);
                // Use the vibe query for recipes
                apiQuery = vibeData.query;
                setDisplayTitle(`Based on "${vibeData.song.title}"`);
            }
        } else {
             setDisplayTitle(
                mood ? `${mood.charAt(0).toUpperCase() + mood.slice(1)} Vibes` 
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
  }, [mood, goals, query, source]);

  return (
    <div className="min-h-screen mesh-gradient p-6">
      <div className="max-w-7xl mx-auto mt-12">
        <div className="flex flex-col gap-4 mb-8">
             <div className="flex items-center gap-4">
                 <button onClick={() => router.back()} className="p-3 glass-card rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                 </button>
                 <h1 className="text-3xl font-bold font-display">{displayTitle}</h1>
             </div>

             {/* Spotify Now Playing Display */}
             {source === "spotify" && currentSong && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 rounded-2xl flex items-center gap-4 max-w-md border-[#1DB954]/30"
                >
                    <img src={currentSong.cover} alt={currentSong.title} className="w-16 h-16 rounded-xl shadow-lg" />
                    <div>
                        <div className="text-xs text-[#1DB954] font-bold uppercase tracking-wider mb-1">Now Playing &bull; Vibe Match</div>
                        <div className="font-bold text-lg leading-tight">{currentSong.title}</div>
                        <div className="text-sm text-gray-400">{currentSong.artist}</div>
                    </div>
                </motion.div>
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
                                rating: recipe.rating
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
                                {recipe.rating && (
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold text-yellow-400">
                                        <Star size={12} fill="currentColor" /> {recipe.rating}
                                    </div>
                                )}
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-xl font-bold mb-3 line-clamp-2">{recipe.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 mt-auto">
                                    <span className="flex items-center gap-1"><Clock size={14} /> {recipe.time || "30 min"}</span>
                                    <span className="flex items-center gap-1"><Flame size={14} /> {recipe.calories || "N/A"} kcal</span>
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
