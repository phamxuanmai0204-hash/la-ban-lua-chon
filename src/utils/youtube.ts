/**
 * Extracts a YouTube video ID from standard watch, share, or shorts URLs.
 */
export function extractYouTubeVideoId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith("http")) return null;
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }
      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        const parts = url.pathname.split("/").filter(Boolean);
        return parts[1] || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnailUrl(rawUrl: string): string | null {
  const id = extractYouTubeVideoId(rawUrl);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
