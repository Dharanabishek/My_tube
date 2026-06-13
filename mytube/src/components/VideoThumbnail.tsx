"use client";

import { useEffect, useRef, useState } from "react";
import { getVideoPreviewUrl, getVideoThumbnailUrl } from "@/lib/media";

type VideoThumbnailProps = {
  video?: {
    filepath?: string;
    videotitle?: string;
    duration?: number | string;
  };
  className?: string;
};

export default function VideoThumbnail({
  video,
  className = "w-full h-full object-cover",
}: VideoThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const thumbnailUrl = getVideoThumbnailUrl(video?.filepath);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [shouldLoad]);

  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt={video?.videotitle || "Video thumbnail"}
        className={className}
        loading="lazy"
      />
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full bg-neutral-900">
      {shouldLoad && (
        <video
          src={getVideoPreviewUrl(video?.filepath, video?.duration)}
          className={className}
          muted
          playsInline
          preload="metadata"
        />
      )}
    </div>
  );
}
