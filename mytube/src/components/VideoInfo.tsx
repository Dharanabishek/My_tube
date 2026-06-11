import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Check,
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { formatViews } from "@/lib/video-meta";

const DEFAULT_SUBSCRIBER_COUNT = 1200000;

const isObjectId = (value?: string) => /^[0-9a-fA-F]{24}$/.test(value || "");

const getChannelId = (video: any) =>
  String(video?.channelId || video?.uploader || video?.videochannel || "");

const getInitialSubscriberCount = (video: any) =>
  Number(
    video?.subscribersCount ??
      video?.subscriberCount ??
      video?.subscribers ??
      DEFAULT_SUBSCRIBER_COUNT
  ) || 0;

const formatSubscriberCount = (count: number) => {
  const safeCount = Math.max(Number(count) || 0, 0);
  let label = safeCount.toLocaleString();

  if (safeCount >= 1000000) {
    label = `${Number((safeCount / 1000000).toFixed(1))}M`;
  } else if (safeCount >= 1000) {
    label = `${Number((safeCount / 1000).toFixed(1))}K`;
  }

  return `${label} ${safeCount === 1 ? "subscriber" : "subscribers"}`;
};

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.like ?? video.Like ?? 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(
    getInitialSubscriberCount(video)
  );
  const [isSubscriptionSaving, setIsSubscriptionSaving] = useState(false);

  const channelId = getChannelId(video);
  const canPersistSubscriptionToDb =
    Boolean(user?._id) && isObjectId(channelId) && user?._id !== channelId;
  const subscriptionStorageKey = `subscription:${user?._id || "guest"}:${channelId}`;
  const subscriberCountStorageKey = `subscriber-count:${channelId}`;
  const descriptionText =
    video.description ||
    video.videoDescription ||
    video.videodescription ||
    "No description provided.";

  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  useEffect(() => {
    setlikes(video.like ?? video.Like ?? 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
    setSubscriberCount(getInitialSubscriberCount(video));
  }, [video]);

  useEffect(() => {
    if (!channelId) return;

    const loadSubscription = async () => {
      const storedSubscribed =
        typeof window !== "undefined"
          ? localStorage.getItem(subscriptionStorageKey)
          : null;
      const storedCount =
        typeof window !== "undefined"
          ? localStorage.getItem(subscriberCountStorageKey)
          : null;

      if (storedSubscribed !== null) {
        setIsSubscribed(storedSubscribed === "true");
      } else {
        setIsSubscribed(false);
      }

      if (storedCount !== null) {
        setSubscriberCount(Number(storedCount) || 0);
      } else {
        setSubscriberCount(getInitialSubscriberCount(video));
      }

      if (!canPersistSubscriptionToDb) return;

      try {
        const res = await axiosInstance.get(
          `/channel/status/${channelId}/${user?._id}`
        );
        setIsSubscribed(Boolean(res.data.subscribed));
        setSubscriberCount(Number(res.data.subscribersCount) || 0);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            subscriptionStorageKey,
            String(Boolean(res.data.subscribed))
          );
          localStorage.setItem(
            subscriberCountStorageKey,
            String(Number(res.data.subscribersCount) || 0)
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadSubscription();
  }, [
    canPersistSubscriptionToDb,
    channelId,
    subscriberCountStorageKey,
    subscriptionStorageKey,
    user?._id,
    video,
  ]);

  useEffect(() => {
    const loadLikedStatus = async () => {
      if (!user) {
        setIsLiked(false);
        return;
      }

      try {
        const res = await axiosInstance.get(`/like/${user?._id}`);
        setIsLiked(
          res.data.some((item: any) => item.videoid?._id === video._id)
        );
      } catch (error) {
        console.log(error);
      }
    };

    loadLikedStatus();
  }, [user, video._id]);

  useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user, video._id]);
  const handleLike = async () => {
    if (!user) return;
    try {
      const wasLiked = isLiked;
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });

      setIsLiked(res.data.liked);
      setlikes((prev: any) => {
        if (res.data.liked && !wasLiked) return prev + 1;
        if (!res.data.liked && wasLiked) return Math.max(prev - 1, 0);
        return prev;
      });

      if (res.data.liked && isDisliked) {
        setDislikes((prev: any) => Math.max(prev - 1, 0));
        setIsDisliked(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleWatchLater = async () => {
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSubscribe = async () => {
    if (!channelId || isSubscriptionSaving) return;

    const nextSubscribed = !isSubscribed;
    const nextCount = Math.max(
      subscriberCount + (nextSubscribed ? 1 : -1),
      0
    );

    setIsSubscribed(nextSubscribed);
    setSubscriberCount(nextCount);

    if (typeof window !== "undefined") {
      localStorage.setItem(subscriptionStorageKey, String(nextSubscribed));
      localStorage.setItem(subscriberCountStorageKey, String(nextCount));
    }

    if (!canPersistSubscriptionToDb) return;

    try {
      setIsSubscriptionSaving(true);
      const res = await axiosInstance.post("/channel/toggle", {
        userId: user?._id,
        channelId,
      });

      setIsSubscribed(Boolean(res.data.subscribed));
      setSubscriberCount(Number(res.data.subscribersCount) || 0);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          subscriptionStorageKey,
          String(Boolean(res.data.subscribed))
        );
        localStorage.setItem(
          subscriberCountStorageKey,
          String(Number(res.data.subscribersCount) || 0)
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubscriptionSaving(false);
    }
  };
  const handleDislike = async () => {
    if (!user) return;
    try {
      if (isLiked) {
        const res = await axiosInstance.post(`/like/${video._id}`, {
          userId: user?._id,
        });

        if (!res.data.liked) {
          setlikes((prev: any) => Math.max(prev - 1, 0));
          setIsLiked(false);
        }
      }

      if (isDisliked) {
        setDislikes((prev: any) => Math.max(prev - 1, 0));
        setIsDisliked(false);
      } else {
        setDislikes((prev: any) => prev + 1);
        setIsDisliked(true);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleDownload = async () => {
    if (!user) {
      setDownloadMessage("Please sign in to download videos.");
      return;
    }

    try {
      setDownloadMessage("");
      const response = await axiosInstance.get(
        `/download/file/${video._id}`,
        { responseType: "blob" }
      );
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = video.filename || `${video.videotitle}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      setDownloadMessage("Saved to browser downloads and profile downloads.");
    } catch (error: any) {
      setDownloadMessage(
        error?.response?.data?.message ||
          "Download failed. Free users can download 1 video per day."
      );
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video.videochannel?.[0]?.toUpperCase() || "V"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{video.videochannel || "Unknown Channel"}</h3>
            <p className="text-sm text-muted-foreground">
              {formatSubscriberCount(subscriberCount)}
            </p>
          </div>
          <Button
            type="button"
            aria-pressed={isSubscribed}
            onClick={handleSubscribe}
            disabled={isSubscriptionSaving}
            className={`ml-0 rounded-full px-5 font-semibold transition-all active:scale-95 ${
              isSubscribed
                ? "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isSubscribed && <Check className="w-4 h-4" />}
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-full bg-secondary text-secondary-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full hover:bg-accent hover:text-accent-foreground active:scale-95"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-5 h-5 mr-2 ${
                  isLiked ? "fill-current text-foreground" : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full hover:bg-accent hover:text-accent-foreground active:scale-95"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-5 h-5 mr-2 ${
                  isDisliked ? "fill-current text-foreground" : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground active:scale-95 ${
              isWatchLater ? "text-primary" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground active:scale-95"
          >
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground active:scale-95"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground active:scale-95"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
        {downloadMessage && (
          <div className="mt-2 text-sm text-muted-foreground">
            {downloadMessage}
          </div>
        )}
      </div>
      <div className="group rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent/40 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
          <span>{formatViews(video.views)}</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
        <div
          className={`whitespace-pre-line text-sm leading-6 text-card-foreground ${
            showFullDescription ? "" : "line-clamp-3"
          }`}
        >
          <p>{descriptionText}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 h-auto rounded-full px-0 py-0 font-semibold text-card-foreground hover:bg-transparent hover:text-muted-foreground"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;
