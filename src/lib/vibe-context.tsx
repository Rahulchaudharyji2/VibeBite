"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Vibe = "energetic" | "chill" | "romantic" | "happy" | "focused" | "stressed" | "neutral";

interface Song {
    title: string;
    artist: string;
    cover: string;
    youtubeId?: string;
    previewUrl?: string;
}

interface VibeContextType {
    currentVibe: Vibe;
    setVibe: (vibe: Vibe) => void;
    gradient: string;
    currentSong: Song | null;
    setSong: (song: Song | null) => void;
}

const VIBE_GRADIENTS: Record<Vibe, string> = {
    "energetic": "linear-gradient(to bottom right, #1a1a1a, #C6FF33, #1a1a1a)", // Neon Lime
    "chill": "linear-gradient(to bottom right, #1a1a1a, #87CEEB, #203A43)",     // Cool Blue
    "romantic": "linear-gradient(to bottom right, #2C0000, #E06C75, #1a1a1a)",   // Soft Red
    "happy": "linear-gradient(to bottom right, #1a1a1a, #FFD700, #FF8C00)",      // Gold/Orange
    "focused": "linear-gradient(to bottom right, #0F2027, #203A43, #2C5364)",    // Deep Teal
    "stressed": "linear-gradient(to bottom right, #23074d, #cc5333, #1a1a1a)",   // Intense Purple/Red (Calming needed?)
    "neutral": "linear-gradient(to bottom right, #1a1a1a, #2a2a2a, #000000)"     // Dark Standard
};

const VibeContext = createContext<VibeContextType | undefined>(undefined);

export function VibeProvider({ children }: { children: React.ReactNode }) {
    const [currentVibe, setCurrentVibe] = useState<Vibe>("neutral");
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [gradient, setGradient] = useState(VIBE_GRADIENTS["neutral"]);

    useEffect(() => {
        setGradient(VIBE_GRADIENTS[currentVibe]);
        console.log(`[VibeContext] Vibe synced to: ${currentVibe}`);
    }, [currentVibe]);

    return (
        <VibeContext.Provider value={{ currentVibe, setVibe: setCurrentVibe, gradient, currentSong, setSong: setCurrentSong }}>
            <div
                className="min-h-screen transition-all duration-1000 ease-in-out"
                style={{ background: gradient }}
            >
                {children}
            </div>
        </VibeContext.Provider>
    );
}

export function useVibe() {
    const context = useContext(VibeContext);
    if (context === undefined) {
        throw new Error('useVibe must be used within a VibeProvider');
    }
    return context;
}
