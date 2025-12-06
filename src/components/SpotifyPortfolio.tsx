"use client";

import { useState } from "react";

function extractTrackId(url: string): string | null {
    try {
        const match = url.match(/track\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

export default function SpotifyPortfolio() {
    const [url, setUrl] = useState("");
    const trackId = extractTrackId(url);

    return (
        <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                Pega el link de tu canción/álbum de Spotify
            </label>
            <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-cyan-400 outline-none transition"
            />
            {trackId ? (
                <div className="overflow-hidden rounded-xl border border-white/10">
                    <iframe
                        src={`https://open.spotify.com/embed/track/${trackId}`}
                        width="100%"
                        height="152"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                    />
                </div>
            ) : (
                <p className="text-xs text-white/40">El embed aparecerá aquí cuando pegues un link válido.</p>
            )}
        </div>
    );
}

