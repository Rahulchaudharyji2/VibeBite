"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Maximize2, Minimize2, Music2 } from "lucide-react";
import { useVibe, Vibe } from "@/lib/vibe-context";
import YouTube, { YouTubeProps } from 'react-youtube';

// Simulated YouTube Music Playlist
interface PlaylistItem {
    title: string;
    artist: string;
    cover: string;
    vibe: string;
    previewUrl?: string; // Legacy: MP3 preview
    youtubeId?: string; // New: YouTube Video ID
}

const PLAYLIST: PlaylistItem[] = [
    { title: "Blinding Lights", artist: "The Weeknd", cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17", vibe: "energetic", youtubeId: "4NRXx6U8ABQ" },
    { title: "Peaches", artist: "Justin Bieber", cover: "https://images.unsplash.com/photo-1523240795612-9a054b0db644", vibe: "happy", youtubeId: "tQ0yjYUFKAE" },
    { title: "Someone Like You", artist: "Adele", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae", vibe: "stressed", youtubeId: "hLQl3WQQoQ0" },
    { title: "Lofi Beats", artist: "Lofi Girl", cover: "https://images.unsplash.com/photo-1516280440614-6697288d5d38", vibe: "focused", youtubeId: "jfKfPfyJRdk" },
    { title: "All of Me", artist: "John Legend", cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b", vibe: "romantic", youtubeId: "450p7goxZqg" },
    { title: "Cold Heart", artist: "Elton John", cover: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", vibe: "chill", youtubeId: "qNHXj-s2faI" }
];

export default function MusicPlayer() {
    const { setVibe, currentSong } = useVibe(); // Get currentSong from context
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const playerRef = useRef<any>(null); // Reference to YouTube Player

    // Use currentSong if available, else fallback to playlist
    const activeTrack = currentSong ? {
        title: currentSong.title,
        artist: currentSong.artist,
        cover: currentSong.cover,
        vibe: "energetic", // Default or needs to be passed in song object
        previewUrl: currentSong.previewUrl,
        youtubeId: currentSong.youtubeId
    } : PLAYLIST[currentIndex];

    // YouTube Player Options
    const opts: YouTubeProps['opts'] = {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 1, // Auto-play when loaded
            controls: 0,
        },
    };

    const onPlayerReady = (event: any) => {
        playerRef.current = event.target;
        if (isPlaying) {
            event.target.playVideo();
        }
    };

    const onPlayerStateChange = (event: any) => {
        // 1 = Playing, 2 = Paused
        setIsPlaying(event.data === 1);
    };

    // Handle Playback State Changes
    useEffect(() => {
        if (activeTrack.youtubeId) {
            // YouTube Logic
            if (audio) {
                audio.pause();
                setAudio(null);
            }

            // Safety check: ensure player is actually ready and has methods
            if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                try {
                    if (isPlaying) {
                        playerRef.current.playVideo();
                    } else {
                        playerRef.current.pauseVideo();
                    }
                } catch (e) {
                    console.warn("YouTube Player Error:", e);
                }
            }
        } else if (activeTrack.previewUrl) {
            // HTML5 Audio Logic (Legacy)
            if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
                try { playerRef.current.pauseVideo(); } catch (e) { }
            }

            if (audio) {
                audio.pause();
            }
            // Only create new audio if the src changed
            if (!audio || audio.src !== activeTrack.previewUrl) {
                const newAudio = new Audio(activeTrack.previewUrl);
                newAudio.volume = 0.5;
                setAudio(newAudio);

                if (isPlaying) {
                    newAudio.play().catch(e => console.log("Auto-play blocked", e));
                }
            } else {
                // Existing audio, just toggle
                if (isPlaying) audio.play();
                else audio.pause();
            }
        }
    }, [activeTrack, isPlaying]); // Re-run when track changes or play state toggles

    // Sync Vibe when track changes (Only for playlist)
    useEffect(() => {
        if (isPlaying && !currentSong) {
            // setVibe(activeTrack.vibe as Vibe); 
        }
    }, [currentIndex, isPlaying, setVibe, currentSong]);

    // Simulate Progress or Update Real Progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                if (playerRef.current && activeTrack.youtubeId) {
                    // YouTube Progress
                    const currentTime = playerRef.current.getCurrentTime();
                    const duration = playerRef.current.getDuration();
                    if (duration > 0) {
                        setProgress((currentTime / duration) * 100);
                    }
                } else {
                    // Simulated/HTML5 Progress
                    setProgress(p => (p >= 100 ? 0 : p + (audio ? (100 / 30) : 0.5)));
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, audio, activeTrack.youtubeId]);

    const handleNext = () => {
        if (!currentSong) {
            setCurrentIndex((prev) => (prev + 1) % PLAYLIST.length);
            setProgress(0);
        }
    };

    const handlePrev = () => {
        if (!currentSong) {
            setCurrentIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
            setProgress(0);
        }
    };

    const togglePlay = () => setIsPlaying(!isPlaying);

    if (!currentSong && !isExpanded) return null;

    return (
        <motion.div
            layout
            className={`fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 text-white shadow-2xl transition-all duration-500 ${isExpanded ? 'h-96' : 'h-20'}`}
        >
            {/* Progress Bar */}
            <div className="h-1 bg-gray-800 w-full">
                <motion.div
                    className="h-full bg-[var(--color-neon-lime)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className={`container mx-auto px-4 h-full flex ${isExpanded ? 'flex-col pt-8' : 'items-center justify-between'}`}>

                {/* Track Info */}
                <div className="flex items-center gap-4">
                    <motion.img
                        src={activeTrack.cover}
                        alt="Album Art"
                        className={`object-cover rounded-lg shadow-lg ${isExpanded ? 'w-48 h-48 mx-auto mb-4' : 'w-12 h-12'}`}
                        animate={{ rotate: isPlaying ? 360 : 0 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                    {!isExpanded && (
                        <div>
                            <h4 className="font-bold text-sm w-48 truncate">{activeTrack.title}</h4>
                            <p className="text-xs text-gray-400 truncate">{activeTrack.artist}</p>
                        </div>
                    )}
                </div>

                {isExpanded && (
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold">{activeTrack.title}</h3>
                        <p className="text-gray-400">{activeTrack.artist}</p>
                        <div className="mt-2 text-xs uppercase tracking-widest text-[var(--color-neon-lime)]">
                            {currentSong ? "Real Vibe Analysis" : `Vibe Matched: ${activeTrack.vibe}`}
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-6 justify-center">
                    <button onClick={handlePrev} className="hover:text-white/70 transition"><SkipBack size={24} /></button>
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition active:scale-95"
                    >
                        {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
                    </button>
                    <button onClick={handleNext} className="hover:text-white/70 transition"><SkipForward size={24} /></button>
                </div>

                {/* Expand Toggle */}
                <div className="hidden md:flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-mono">
                        {activeTrack.youtubeId ? "YOUTUBE PLAYER" : "SIMULATED PLAYER"}
                    </span>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="hover:text-white/70">
                        {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Hidden YouTube Player */}
            {activeTrack.youtubeId && (
                <div className="hidden">
                    <YouTube
                        videoId={activeTrack.youtubeId}
                        opts={opts}
                        onReady={onPlayerReady}
                        onStateChange={onPlayerStateChange}
                    />
                </div>
            )}
        </motion.div>
    );
}
