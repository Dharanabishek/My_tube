"use client";

import { useRef, useEffect } from "react";
import { getMediaUrl } from "@/lib/media";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if filepath is a YouTube URL
  const videoUrl = getMediaUrl(video?.filepath);
  const isYouTubeUrl = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

  if (isYouTubeUrl) {
    // For YouTube embed URLs
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={videoUrl}
          title={video?.videotitle}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // For local video files
  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
      >
        <source
          src={videoUrl}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
