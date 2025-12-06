"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Pause, Square, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { audioManager } from "@/lib/audioManager";

function formatTime(sec: number): string {
    if (!isFinite(sec) || sec < 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function GlobalPlayer() {
    const [isPlaying, setIsPlaying] = useState(audioManager.isPlaying());
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(audioManager.getVolume());
    const [currentUrl, setCurrentUrl] = useState<string | null>(audioManager.getCurrentUrl());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(audioManager.getCurrentTime());
            setDuration(audioManager.getDuration());
            setCurrentUrl(audioManager.getCurrentUrl());
        }, 300);
        const unsubscribe = audioManager.subscribe((state) => setIsPlaying(state === "playing"));
        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, []);

    const trackLabel = useMemo(() => {
        const url = currentUrl;
        if (!url) return { title: "Sin track", artist: "--" };
        try {
            const parsed = new URL(url);
            const name = decodeURIComponent(parsed.pathname.split("/").pop() || "Track");
            return { title: name, artist: "Archivo" };
        } catch {
            return { title: url.split("/").pop() || "Track", artist: "Archivo" };
        }
    }, [currentUrl]);

    const handlePlayPause = () => {
        if (isPlaying) {
            audioManager.pause();
        } else {
            const url = currentUrl;
            audioManager.play(url || "", audioManager.getCurrentTime());
        }
    };

    const handleSeek = (value: number) => {
        audioManager.seek(value);
        setCurrentTime(value);
    };

    const handleVolume = (value: number) => {
        const v = value / 100;
        setVolume(v);
        audioManager.setVolume(v);
    };

    return (
        <div className="fixed bottom-0 inset-x-0 z-40">
            <div className="mx-auto max-w-6xl px-4">
                <div className="mb-3 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                <div className="rounded-2xl border border-slate-800 bg-black/70 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center gap-4 px-4 py-3">
                        {/* Meta */}
                        <div className="min-w-[180px]">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Reproduciendo</p>
                            <p className="text-sm font-semibold text-white">{trackLabel.title}</p>
                            <p className="text-[11px] text-white/50">{trackLabel.artist}</p>
                        </div>

                        {/* Controles */}
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition" title="Anterior">
                                <SkipBack className="w-4 h-4 text-white/80" />
                            </button>
                            <button
                                onClick={handlePlayPause}
                                className="p-3 rounded-lg bg-white text-black hover:scale-105 transition shadow"
                                title={isPlaying ? "Pausar" : "Reproducir"}
                            >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <button onClick={() => audioManager.stop()} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition" title="Stop">
                                <Square className="w-4 h-4 text-white/80" />
                            </button>
                            <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition" title="Siguiente">
                                <SkipForward className="w-4 h-4 text-white/80" />
                            </button>
                        </div>

                        {/* Barra de tiempo */}
                        <div className="flex-1 flex items-center gap-3">
                            <span className="text-[11px] text-white/60 font-mono w-12">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min={0}
                                max={Math.max(duration, 1)}
                                value={Math.min(currentTime, duration || 1)}
                                onChange={(e) => handleSeek(Number(e.target.value))}
                                className="w-full accent-cyan-500"
                            />
                            <span className="text-[11px] text-white/60 font-mono w-12 text-right">{formatTime(duration)}</span>
                        </div>

                        {/* Volumen */}
                        <div className="flex items-center gap-2 min-w-[140px]">
                            <Volume2 className="w-4 h-4 text-white/70" />
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={Math.round(volume * 100)}
                                onChange={(e) => handleVolume(Number(e.target.value))}
                                className="w-full accent-yellow-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

