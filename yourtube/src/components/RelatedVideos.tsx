import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import VideoThumbnail from "./VideoThumbnail";
import { formatViews, getVideoDisplayDuration } from "@/lib/video-meta";

interface RelatedVideosProps {
  videos: Array<{
    _id: string;
    videotitle: string;
    videochannel: string;
    views: number;
    duration?: number;
    createdAt: string;
    filepath?: string;
  }>;
}

export default function RelatedVideos({ videos }: RelatedVideosProps) {
  return (
    <div className="space-y-2">
      {videos.map((video) => {
        const duration = getVideoDisplayDuration(video);

        return (
          <Link
            key={video._id}
            href={`/watch/${video._id}`}
            className="flex gap-2 group"
          >
            <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden flex-shrink-0">
              <VideoThumbnail
                video={video}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {duration && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                  {duration}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
                {video.videotitle}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {video.videochannel || "Unknown Channel"}
              </p>
              <p className="text-xs text-gray-600">
                {formatViews(video.views)} &bull;{" "}
                {formatDistanceToNow(new Date(video.createdAt))} ago
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
