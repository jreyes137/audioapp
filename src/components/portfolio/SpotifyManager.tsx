"use client";

import { useState } from "react";
import { getSpotifyEmbedUrl } from "@/lib/spotifyUtils";

interface SpotifyManagerProps {
    initialUrls?: string[];
    onChange?: (urls: string[]) => void;
}

export default function SpotifyManager({ initialUrls = [], onChange }: SpotifyManagerProps) {
    const [input, setInput] = useState("");
    const [urls, setUrls] = useState<string[]>(initialUrls);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = () => {
        const embed = getSpotifyEmbedUrl(input);
        if (!embed) {
            setError("Link inválido de Spotify");
            return;
        }
        const next = [...urls, embed];
        setUrls(next);
        setInput("");
        setError(null);
        onChange?.(next);
    };

    const handleRemove = (idx: number) => {
        const next = urls.filter((_, i) => i !== idx);
        setUrls(next);
        onChange?.(next);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                    Pega tu link de Spotify
                </label>
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="https://open.spotify.com/track/..."
                        className="flex-1 bg-black border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-cyan-400 outline-none transition"
                    />
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold text-sm hover:scale-105 transition"
                    >
                        Añadir Track
                    </button>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <div className="space-y-3">
                {urls.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative">
                        <iframe
                            src={url}
                            width="100%"
                            height="152"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            className="rounded-xl shadow-lg border-0"
                        />
                        <button
                            onClick={() => handleRemove(idx)}
                            className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-red-500/90 text-white font-bold hover:bg-red-400"
                        >
                            🗑
                        </button>
                    </div>
                ))}

                {urls.length === 0 && (
                    <p className="text-xs text-white/40">Aún no has añadido embeds de Spotify.</p>
                )}
            </div>
        </div>
    );
}

