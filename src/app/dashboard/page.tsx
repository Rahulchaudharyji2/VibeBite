"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Music, Activity, Search, User } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!isLoaded) return null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen mesh-gradient p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-16 max-w-7xl mx-auto pt-6">
        <h1 className="text-3xl font-black tracking-tighter">
          Vibe<span className="text-[var(--color-creamy-gold)]">Bite</span>
        </h1>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:bg-white/10 transition-colors text-sm font-medium text-gray-300"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-full">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="w-8 h-8 rounded-full border border-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <User size={16} />
              </div>
            )}
            <span className="font-medium text-sm hidden sm:block">{user?.fullName}</span>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="p-3 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* The Choice Section */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-6xl font-display font-bold">
            How's Your <span className="text-gradient">Vibe?</span>
          </h2>
          <p className="text-xl text-gray-400">Choose your path to the perfect meal.</p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {/* Mood Mode */}
          <Link href="/mood" className="group">
            <motion.div variants={item} className="h-[400px] glass-card rounded-[2rem] p-8 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                  <Music size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-3">Mood Mode</h3>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    Connect your Spotify and let your music taste decide your dinner. The ultimate vibe sync.
                  </p>
                  <span className="inline-flex items-center text-purple-400 font-medium group-hover:gap-2 transition-all">
                    Sync Vibe <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Health Mode */}
          <Link href="/health" className="group">
            <motion.div variants={item} className="h-[400px] glass-card rounded-[2rem] p-8 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 mb-6">
                  <Activity size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-3">Health Mode</h3>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    Strictly follow your goals. Keto, High Protein, or Low Sodium - we track the macros for you.
                  </p>
                  <span className="inline-flex items-center text-red-400 font-medium group-hover:gap-2 transition-all">
                    Set Goals <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Custom Mode */}
          <Link href="/custom" className="group">
            <motion.div variants={item} className="h-[400px] glass-card rounded-[2rem] p-8 relative overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_40px_rgba(198,255,51,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-neon-lime)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-neon-lime)]/20 flex items-center justify-center text-[var(--color-neon-lime)] mb-6">
                  <Search size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-3">Custom Mode</h3>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    Have a specific craving? "Spicy pasta with extra cheese" - we'll find exactly that.
                  </p>
                  <span className="inline-flex items-center text-[var(--color-neon-lime)] font-medium group-hover:gap-2 transition-all">
                    Search Now <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
