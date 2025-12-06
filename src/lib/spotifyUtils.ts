export function getSpotifyEmbedUrl(inputUrl: string): string | null {
    if (!inputUrl || typeof inputUrl !== "string") return null;
    try {
        const clean = inputUrl.trim();
        const regex = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
        const match = clean.match(regex);
        if (!match) return null;
        const [, type, id] = match;
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
    } catch {
        return null;
    }
}

