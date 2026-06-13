const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000";

export function getMediaUrl(filepath?: string) {
  if (!filepath) return "";

  if (/^https?:\/\//i.test(filepath) || filepath.startsWith("/video/")) {
    return filepath;
  }

  const normalizedPath = filepath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${BACKEND_URL.replace(/\/+$/, "")}/${normalizedPath}`;
}

export function getYouTubeVideoId(filepath?: string) {
  if (!filepath) return "";

  try {
    const url = new URL(filepath);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }

    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/embed/")[1]?.split("/")[0] || "";
    }

    return url.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

export function getVideoThumbnailUrl(filepath?: string) {
  const youtubeId = getYouTubeVideoId(filepath);

  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  return "";
}

function getPreviewTime(duration?: number | string) {
  const totalSeconds = Number(duration) || 0;

  if (totalSeconds > 0 && totalSeconds <= 10) {
    return Math.max(1, Math.min(totalSeconds - 0.5, totalSeconds / 2));
  }

  if (totalSeconds > 10 && totalSeconds <= 60) {
    return Math.min(5, totalSeconds / 2);
  }

  return 12;
}

export function getVideoPreviewUrl(filepath?: string, duration?: number | string) {
  const mediaUrl = getMediaUrl(filepath);

  if (!mediaUrl || getYouTubeVideoId(filepath)) {
    return mediaUrl;
  }

  return `${mediaUrl}#t=${getPreviewTime(duration).toFixed(1)}`;
}
