"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { getMediaUrl } from "@/lib/media";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  nextVideoId?: string;
  onOpenComments?: () => void;
}

export default function VideoPlayer({ video, nextVideoId, onOpenComments }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);
  const tapZoneRef = useRef<"left" | "center" | "right">("center");
  const { user } = useUser();
  const router = useRouter();
  const [watchLimitSeconds, setWatchLimitSeconds] = useState<number | null>(5 * 60);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    const loadPlan = async () => {
      if (!user?._id) {
        setWatchLimitSeconds(5 * 60);
        return;
      }
      try {
        const res = await axiosInstance.get(`/payment/subscription/${user._id}`);
        setWatchLimitSeconds(res.data.watchLimitSeconds ?? null);
      } catch (error) {
        setWatchLimitSeconds(5 * 60);
      }
    };
    loadPlan();
  }, [user?._id]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player) return;

    const enforceLimit = () => {
      if (watchLimitSeconds !== null && player.currentTime >= watchLimitSeconds) {
        player.pause();
        player.currentTime = watchLimitSeconds;
        setLimitReached(true);
      }
    };

    player.addEventListener("timeupdate", enforceLimit);
    return () => player.removeEventListener("timeupdate", enforceLimit);
  }, [watchLimitSeconds]);

  const runGesture = (zone: "left" | "center" | "right", count: number) => {
    const player = videoRef.current;

    if (count === 1 && zone === "center" && player) {
      player.paused ? player.play() : player.pause();
      return;
    }

    if (count === 2 && zone === "right" && player) {
      player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 10);
      return;
    }

    if (count === 2 && zone === "left" && player) {
      player.currentTime = Math.max(0, player.currentTime - 10);
      return;
    }

    if (count === 3 && zone === "center" && nextVideoId) {
      router.push(`/watch/${nextVideoId}`);
      return;
    }

    if (count === 3 && zone === "left") {
      onOpenComments?.();
      return;
    }

    if (count === 3 && zone === "right") {
      window.close();
      if (!window.closed) window.location.href = "about:blank";
    }
  };

  const handleTap = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const zone =
      x < rect.width / 3 ? "left" : x > (rect.width * 2) / 3 ? "right" : "center";

    if (tapTimerRef.current && tapZoneRef.current !== zone) {
      clearTimeout(tapTimerRef.current);
      tapCountRef.current = 0;
    }

    tapZoneRef.current = zone;
    tapCountRef.current += 1;

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      runGesture(tapZoneRef.current, tapCountRef.current);
      tapCountRef.current = 0;
    }, 260);
  };

  // Check if filepath is a YouTube URL
  const videoUrl = getMediaUrl(video?.filepath);
  const isYouTubeUrl = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

  if (isYouTubeUrl) {
    // For YouTube embed URLs
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
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
        <button
          aria-label="Open comments"
          className="absolute left-0 top-0 h-full w-1/3 opacity-0"
          onClick={onOpenComments}
        />
      </div>
    );
  }

  // For local video files
  return (
    <div
      className="relative aspect-video bg-black rounded-lg overflow-hidden"
      onClick={handleTap}
    >
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
      {limitReached && (
        <div className="absolute inset-x-0 bottom-0 bg-black/80 px-4 py-3 text-sm text-white">
          Watch limit reached for your active plan. Upgrade from profile settings
          to continue watching.
        </div>
      )}
    </div>
  );
}
