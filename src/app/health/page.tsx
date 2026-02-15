"use client";

import { motion } from "framer-motion";
import { Activity, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HealthPage() {
    const router = useRouter();
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

    const goals = [
        { id: "high-protein", name: "High Protein", description: "Muscle building focus." },
        { id: "low-sodium", name: "Low Sodium", description: "Heart healthy choices." },
        { id: "keto", name: "Keto Friendly", description: "Low carb, high fat." },
        { id: "vegan", name: "Pure Vegan", description: "No animal products." },
        { id: "low-calorie", name: "Low Calorie", description: "Weight management." },
    ];

    const toggleGoal = (id: string) => {
        setSelectedGoals(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const handleContinue = () => {
        if (selectedGoals.length > 0) {
            router.push(`/recipe/results?goals=${selectedGoals.join(",")}`);
        }
    };

    return (
        <div className="min-h-screen mesh-gradient p-6 flex flex-col items-center justify-center relative">

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
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 text-red-500 mb-8 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                        <Activity size={48} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
                        Fuel Your <span className="text-gradient">Goals</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Select your dietary preferences and health targets. We'll filter out the rest.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap justify-center gap-6 mb-12"
                >
                    {goals.map((goal) => (
                        <button
                            key={goal.id}
                            onClick={() => toggleGoal(goal.id)}
                            className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden group ${selectedGoals.includes(goal.id)
                                    ? "bg-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                                    : "glass-card border-white/10 hover:border-red-500/50 hover:bg-white/5"
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold">{goal.name}</h3>
                                {selectedGoals.includes(goal.id) && (
                                    <div className="bg-white text-red-500 rounded-full p-1">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                            <p className={`text-sm ${selectedGoals.includes(goal.id) ? "text-red-100" : "text-gray-400"}`}>
                                {goal.description}
                            </p>
                        </button>
                    ))}
                </motion.div>

                <div className="flex justify-center">
                    <button
                        onClick={handleContinue}
                        disabled={selectedGoals.length === 0}
                        className="px-8 py-4 bg-white text-black font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                    >
                        Find Healthy Recipes <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
