"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Maximize, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { getMediaUrl, getYouTubeVideoId } from "@/lib/media";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";

type TapZone = "left" | "center" | "right";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  nextVideoId?: string;
  onOpenComments?: () => void;
}

const TAP_WINDOW_MS = 280;

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function VideoPlayer({
  video,
  nextVideoId,
  onOpenComments,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);
  const tapZoneRef = useRef<TapZone>("center");
  const { user } = useUser();
  const router = useRouter();
  const [watchLimitSeconds, setWatchLimitSeconds] = useState<number | null>(
    5 * 60
  );
  const [limitReached, setLimitReached] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [gestureFeedback, setGestureFeedback] = useState<{
    zone: TapZone;
    label: string;
  } | null>(null);
  const videoUrl = getMediaUrl(video?.filepath);
  const youtubeId =
    getYouTubeVideoId(video?.filepath) || getYouTubeVideoId(videoUrl);
  const isYouTubeUrl = Boolean(youtubeId);
  const youtubeEmbedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&playsinline=1&controls=0&rel=0&modestbranding=1${
        typeof window !== "undefined"
          ? `&origin=${encodeURIComponent(window.location.origin)}`
          : ""
      }`
    : videoUrl;

  const showGestureFeedback = useCallback((zone: TapZone, label: string) => {
    setGestureFeedback({ zone, label });

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setGestureFeedback(null);
    }, 520);
  }, []);

  const sendYouTubeCommand = useCallback((func: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func,
        args,
      }),
      "*"
    );
  }, []);

  const togglePlayback = useCallback(() => {
    if (isYouTubeUrl) {
      sendYouTubeCommand(isPlaying ? "pauseVideo" : "playVideo");
      setIsPlaying((playing) => !playing);
      return;
    }

    const player = videoRef.current;
    if (!player || limitReached) return;

    if (player.paused) {
      void player.play();
      return;
    }

    player.pause();
  }, [isPlaying, isYouTubeUrl, limitReached, sendYouTubeCommand]);

  const seekBy = useCallback(
    (seconds: number) => {
      if (isYouTubeUrl) {
        const maxTime =
          watchLimitSeconds === null
            ? duration || Infinity
            : Math.min(duration || Infinity, watchLimitSeconds);
        const nextTime = Math.min(maxTime, Math.max(0, currentTime + seconds));

        sendYouTubeCommand("seekTo", [nextTime, true]);
        setCurrentTime(nextTime);
        return;
      }

      const player = videoRef.current;
      if (!player) return;

      const maxTime =
        watchLimitSeconds === null
          ? player.duration || Infinity
          : Math.min(player.duration || Infinity, watchLimitSeconds);
      player.currentTime = Math.min(
        maxTime,
        Math.max(0, player.currentTime + seconds)
      );
    },
    [
      currentTime,
      duration,
      isYouTubeUrl,
      sendYouTubeCommand,
      watchLimitSeconds,
    ]
  );

  const closeWebsite = useCallback(() => {
    window.close();

    if (!window.closed) {
      window.location.href = "about:blank";
    }
  }, []);

  const runGesture = useCallback(
    (zone: TapZone, count: number) => {
      if (count === 1 && zone === "center") {
        togglePlayback();
        showGestureFeedback(zone, isPlaying ? "Pause" : "Play");
        return;
      }

      if (count === 2 && zone === "right") {
        seekBy(10);
        showGestureFeedback(zone, "+10");
        return;
      }

      if (count === 2 && zone === "left") {
        seekBy(-10);
        showGestureFeedback(zone, "-10");
        return;
      }

      if (count === 3 && zone === "center" && nextVideoId) {
        showGestureFeedback(zone, "Next");
        void router.push(`/watch/${nextVideoId}`);
        return;
      }

      if (count === 3 && zone === "left") {
        showGestureFeedback(zone, "Comments");
        onOpenComments?.();
        return;
      }

      if (count === 3 && zone === "right") {
        showGestureFeedback(zone, "Close");
        closeWebsite();
      }
    },
    [
      closeWebsite,
      isPlaying,
      nextVideoId,
      onOpenComments,
      router,
      seekBy,
      showGestureFeedback,
      togglePlayback,
    ]
  );

  const flushTapGesture = useCallback(() => {
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    runGesture(tapZoneRef.current, tapCountRef.current);
    tapCountRef.current = 0;
    tapTimerRef.current = null;
  }, [runGesture]);

  const handleGesturePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const zone: TapZone =
      x < rect.width / 3
        ? "left"
        : x > (rect.width * 2) / 3
        ? "right"
        : "center";

    if (tapTimerRef.current && tapZoneRef.current !== zone) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      tapCountRef.current = 0;
    }

    tapZoneRef.current = zone;
    tapCountRef.current += 1;

    if (tapCountRef.current >= 3) {
      flushTapGesture();
      return;
    }

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(flushTapGesture, TAP_WINDOW_MS);
  };

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

    const syncTime = () => {
      setCurrentTime(player.currentTime);
      setDuration(Number.isFinite(player.duration) ? player.duration : 0);
    };
    const syncPlaying = () => setIsPlaying(!player.paused);
    const enforceLimit = () => {
      syncTime();

      if (
        watchLimitSeconds !== null &&
        player.currentTime >= watchLimitSeconds
      ) {
        player.pause();
        player.currentTime = watchLimitSeconds;
        setCurrentTime(watchLimitSeconds);
        setLimitReached(true);
      }
    };

    player.addEventListener("loadedmetadata", syncTime);
    player.addEventListener("timeupdate", enforceLimit);
    player.addEventListener("play", syncPlaying);
    player.addEventListener("pause", syncPlaying);
    player.addEventListener("ended", syncPlaying);
    syncTime();
    syncPlaying();

    return () => {
      player.removeEventListener("loadedmetadata", syncTime);
      player.removeEventListener("timeupdate", enforceLimit);
      player.removeEventListener("play", syncPlaying);
      player.removeEventListener("pause", syncPlaying);
      player.removeEventListener("ended", syncPlaying);
    };
  }, [watchLimitSeconds, video?._id]);

  useEffect(() => {
    if (!isYouTubeUrl) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;

      try {
        const payload = JSON.parse(event.data);
        const info = payload?.info;
        if (payload?.event !== "infoDelivery" || !info) return;

        if (typeof info.duration === "number") {
          setDuration(info.duration);
        }

        if (typeof info.currentTime === "number") {
          const nextTime =
            watchLimitSeconds !== null && info.currentTime >= watchLimitSeconds
              ? watchLimitSeconds
              : info.currentTime;

          setCurrentTime(nextTime);

          if (
            watchLimitSeconds !== null &&
            info.currentTime >= watchLimitSeconds
          ) {
            sendYouTubeCommand("pauseVideo");
            sendYouTubeCommand("seekTo", [watchLimitSeconds, true]);
            setLimitReached(true);
          }
        }

        if (typeof info.playerState === "number") {
          setIsPlaying(info.playerState === 1);
        }
      } catch {
        // Ignore messages from other frames.
      }
    };

    window.addEventListener("message", handleMessage);
    const interval = window.setInterval(() => {
      sendYouTubeCommand("getCurrentTime");
      sendYouTubeCommand("getDuration");
      sendYouTubeCommand("getPlayerState");
    }, 500);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.clearInterval(interval);
    };
  }, [isYouTubeUrl, sendYouTubeCommand, video?._id, watchLimitSeconds]);

  useEffect(() => {
    setLimitReached(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setGestureFeedback(null);
  }, [video?._id]);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const progressMax =
    watchLimitSeconds === null
      ? duration || 0
      : Math.min(duration || watchLimitSeconds, watchLimitSeconds);
  const progressValue = progressMax ? Math.min(currentTime, progressMax) : 0;
  const feedbackPosition =
    gestureFeedback?.zone === "left"
      ? "left-8"
      : gestureFeedback?.zone === "right"
      ? "right-8"
      : "left-1/2 -translate-x-1/2";

  const handleProgressChange = (value: string) => {
    const player = videoRef.current;
    if (!player) return;

    const nextTime = Number(value);
    player.currentTime = nextTime;
    setCurrentTime(nextTime);
    setLimitReached(
      watchLimitSeconds !== null && nextTime >= watchLimitSeconds
    );
  };

  const enterFullScreen = () => {
    void playerContainerRef.current?.requestFullscreen?.();
  };

  const gestureLayer = (
    <div
      className="absolute inset-0 z-10 cursor-pointer select-none [touch-action:manipulation]"
      onPointerUp={handleGesturePointerUp}
      role="presentation"
    />
  );

  const playerControls = (
    <div
      className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-10 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
      onPointerUp={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-3 text-white">
        <button
          type="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlayback}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          aria-label="Back 10 seconds"
          onClick={() => seekBy(-10)}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 sm:flex"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Forward 10 seconds"
          onClick={() => seekBy(10)}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 sm:flex"
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <span className="w-20 shrink-0 text-xs tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <input
          aria-label="Video progress"
          type="range"
          min={0}
          max={progressMax || 0}
          step={0.1}
          value={progressValue}
          onChange={(event) => handleProgressChange(event.target.value)}
          className="h-1 flex-1 accent-white"
        />
        <button
          type="button"
          aria-label="Full screen"
          onClick={enterFullScreen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (isYouTubeUrl) {
    return (
      <div
        ref={playerContainerRef}
        className="group relative aspect-video overflow-hidden rounded-lg bg-black"
      >
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={youtubeEmbedUrl}
          title={video?.videotitle}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
        {gestureLayer}
        {gestureFeedback && (
          <div
            className={`pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/75 px-4 py-2 text-sm font-medium text-white ${feedbackPosition}`}
          >
            {gestureFeedback.label}
          </div>
        )}
        {playerControls}
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      className="group relative aspect-video overflow-hidden rounded-lg bg-black"
    >
      <video ref={videoRef} className="h-full w-full" playsInline>
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {gestureLayer}

      {gestureFeedback && (
        <div
          className={`pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/75 px-4 py-2 text-sm font-medium text-white ${feedbackPosition}`}
        >
          {gestureFeedback.label}
        </div>
      )}

      {playerControls}

      {limitReached && (
        <div className="absolute inset-x-0 bottom-16 z-40 bg-black/80 px-4 py-3 text-sm text-white">
          Watch limit reached for your active plan. Upgrade from profile settings
          to continue watching.
        </div>
      )}
    </div>
  );
}
