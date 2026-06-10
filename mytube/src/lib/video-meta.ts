import { getYouTubeVideoId } from "./media";

const KNOWN_YOUTUBE_DURATIONS: Record<string, number> = {
  JGwWNGJdvx8: 233,
  XqZsoesa55w: 136,
  "0e3GPea1Tyg": 1210,
  t0Q2otsqC4I: 603,
  "60ItHLz5WEA": 213,
  "zOjov-2OZ0E": 3600,
  kX0vO4vlJuU: 1546,
  "6LTYq-qMags": 3600,
  OUKGsb8CpF8: 612,
  TcMBFSGVi1c: 286,
};

export function formatVideoDuration(duration?: number | string) {
  const totalSeconds = Math.floor(Number(duration) || 0);

  if (totalSeconds <= 0) {
    return "";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getVideoDisplayDuration(video?: {
  duration?: number | string;
  filepath?: string;
}) {
  const savedDuration = Number(video?.duration) || 0;

  if (savedDuration > 0) {
    return formatVideoDuration(savedDuration);
  }

  const youtubeId = getYouTubeVideoId(video?.filepath);
  return formatVideoDuration(KNOWN_YOUTUBE_DURATIONS[youtubeId]);
}

export function formatViews(views?: number) {
  return `${(views || 0).toLocaleString()} views`;
}

export function getFileVideoDuration(file: File) {
  return new Promise<number>((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
    video.src = objectUrl;
  });
}
