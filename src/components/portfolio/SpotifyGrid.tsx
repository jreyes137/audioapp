"use client";

interface SpotifyGridProps {
    urls: string[];
}

export default function SpotifyGrid({ urls }: SpotifyGridProps) {
    if (!urls || urls.length === 0) {
        return <p className="text-sm text-white/50">Sin embeds de Spotify aún.</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urls.map((url, idx) => (
                <iframe
                    key={`${url}-${idx}`}
                    src={url}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl shadow-lg border-0 bg-slate-900"
                />
            ))}
        </div>
    );
}

