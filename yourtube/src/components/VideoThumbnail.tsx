"use client";

import { getVideoPreviewUrl, getVideoThumbnailUrl } from "@/lib/media";

type VideoThumbnailProps = {
  video?: {
    filepath?: string;
    videotitle?: string;
  };
  className?: string;
};

export default function VideoThumbnail({
  video,
  className = "w-full h-full object-cover",
}: VideoThumbnailProps) {
  const thumbnailUrl = getVideoThumbnailUrl(video?.filepath);

  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt={video?.videotitle || "Video thumbnail"}
        className={className}
      />
    );
  }

  return (
    <video
      src={getVideoPreviewUrl(video?.filepath)}
      className={className}
      muted
      playsInline
      preload="metadata"
    />
  );
}
