"use client";


import { motion } from "framer-motion";
import { Music, ArrowRight, Loader2, ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MoodPage() {
    const router = useRouter();
    const [isConnecting, setIsConnecting] = useState(false);

    const moods = [
        { name: "Happy", color: "bg-yellow-400", shadow: "shadow-yellow-400/50" },
        { name: "Sad", color: "bg-blue-600", shadow: "shadow-blue-600/50" },
        { name: "Energetic", color: "bg-red-500", shadow: "shadow-red-500/50" },
        { name: "Chill", color: "bg-purple-500", shadow: "shadow-purple-500/50" },
        { name: "Romantic", color: "bg-pink-500", shadow: "shadow-pink-500/50" },
        { name: "Focused", color: "bg-teal-500", shadow: "shadow-teal-500/50" },
    ];

    const handleSpotifyConnect = () => {
        setIsConnecting(true);
        // Simulate connection for now
        setTimeout(() => {
            setIsConnecting(false);
            router.push("/recipe/results?source=spotify");
        }, 2000);
    };

    const handleMoodSelect = (mood: string) => {
        router.push(`/recipe/results?mood=${mood.toLowerCase()}`);
    }

    return (
        <div className="min-h-screen mesh-gradient p-6 flex flex-col items-center justify-center relative overflow-hidden">

            {/* Navigation */}
            <div className="absolute top-6 left-6 z-20">
                <button onClick={() => router.back()} className="p-4 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors border border-white/5 group">
                    <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="max-w-5xl w-full relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-500/20 text-purple-400 mb-8 border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
                        <Music size={48} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
                        Let The Music <br /> <span className="text-gradient">Decide Your Meal</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Connect your Spotify to analyze your current vibe, or manually tell us how you're feeling.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                    {/* Spotify Option */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-10 rounded-[2.5rem] h-full flex flex-col justify-between border-green-500/20 hover:border-green-500/50 transition-all hover:bg-green-500/5"
                    >
                        <div>
                            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center text-white"><Music size={18} /></div> YT-music Vibe</h2>
                            <p className="text-gray-400 mb-6 text-lg leading-relaxed">Enter a song you're listening to, and we'll match the food to its beat.</p>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="e.g. Blinding Lights"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#1DB954] transition-colors pl-12"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value;
                                            if (val) {
                                                setIsConnecting(true);
                                                router.push(`/recipe/results?source=youtube&query=${encodeURIComponent(val)}`);
                                            }
                                        }
                                    }}
                                    id="song-input"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const input = document.getElementById('song-input') as HTMLInputElement;
                                const val = input?.value;
                                if (val) {
                                    setIsConnecting(true);
                                    router.push(`/recipe/results?source=youtube&query=${encodeURIComponent(val)}`);
                                }
                            }}
                            disabled={isConnecting}
                            className="mt-6 w-full py-5 bg-[#FF0000] hover:bg-[#ff1a1a] text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-[0_0_30px_rgba(255,0,0,0.3)] hover:shadow-[0_0_50px_rgba(255,0,0,0.5)]"
                        >
                            {isConnecting ? <Loader2 className="animate-spin" /> : <Music size={24} />}
                            {isConnecting ? "Analyzing..." : "Analyze Song"}
                        </button>
                    </motion.div>

                    {/* Manual Selection */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-10 rounded-[2.5rem]"
                    >
                        <h2 className="text-3xl font-bold mb-8">Select Manually</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {moods.map((mood) => (
                                <button
                                    key={mood.name}
                                    onClick={() => handleMoodSelect(mood.name)}
                                    className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex items-center gap-3 group relative overflow-hidden"
                                >
                                    <span className={`w-3 h-3 rounded-full ${mood.color} ${mood.shadow} shadow-lg`} />
                                    <span className="font-medium group-hover:tracking-wide transition-all text-lg">{mood.name}</span>
                                    <div className={`absolute inset-0 ${mood.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
