import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VideoThumbnail from "./VideoThumbnail";
import { formatViews, getVideoDisplayDuration } from "@/lib/video-meta";

const SearchResult = ({ query }: any) => {
  const [video, setvideos] = useState<any>(null);

  if (!query.trim()) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          Enter a search term to find videos and channels.
        </p>
      </div>
    );
  }

  const videos = async () => {
    const allVideos = [
      {
        _id: "1",
        videotitle: "Amazing Nature Documentary",
        filename: "nature-doc.mp4",
        filetype: "video/mp4",
        filepath: "/videos/nature-doc.mp4",
        filesize: "500MB",
        videochannel: "Nature Channel",
        Like: 1250,
        views: 45000,
        duration: 1500,
        uploader: "nature_lover",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "2",
        videotitle: "Cooking Tutorial: Perfect Pasta",
        filename: "pasta-tutorial.mp4",
        filetype: "video/mp4",
        filepath: "/videos/pasta-tutorial.mp4",
        filesize: "300MB",
        videochannel: "Chef's Kitchen",
        Like: 890,
        views: 23000,
        duration: 620,
        uploader: "chef_master",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    const results = allVideos.filter(
      (vid) =>
        vid.videotitle.toLowerCase().includes(query.toLowerCase()) ||
        vid.videochannel.toLowerCase().includes(query.toLowerCase())
    );
    setvideos(results);
  };

  useEffect(() => {
    videos();
  }, [query]);

  if (!video) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No results found</h2>
        <p className="text-gray-600">
          Try different keywords or remove search filters
        </p>
      </div>
    );
  }

  const hasResults = video ? video.length > 0 : true;

  if (!hasResults) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No results found</h2>
        <p className="text-gray-600">
          Try different keywords or remove search filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {video.length > 0 && (
        <div className="space-y-4">
          {video.map((video: any) => {
            const duration = getVideoDisplayDuration(video);

            return (
              <div key={video._id} className="flex gap-4 group">
                <Link href={`/watch/${video._id}`} className="flex-shrink-0">
                  <div className="relative w-80 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <VideoThumbnail
                      video={video}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
                        {duration}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0 py-1">
                  <Link href={`/watch/${video._id}`}>
                    <h3 className="font-medium text-lg line-clamp-2 group-hover:text-blue-600 mb-2">
                      {video.videotitle}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span>{formatViews(video.views)}</span>
                    <span>&bull;</span>
                    <span>
                      {formatDistanceToNow(new Date(video.createdAt))} ago
                    </span>
                  </div>

                  <Link
                    href={`/channel/${video.uploader}`}
                    className="flex items-center gap-2 mb-2 hover:text-blue-600"
                  >
                    <Avatar className="w-6h-6">
                      <AvatarImage src="/placeholder.svg?height=24&width=24" />
                      <AvatarFallback className="text-xs">
                        {video.videochannel?.[0]?.toUpperCase() || "V"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">
                      {video.videochannel || "Unknown Channel"}
                    </span>
                  </Link>

                  <p className="text-sm text-gray-700 line-clamp-2">
                    Sample video description that would show search-relevant
                    content and help users understand what the video is about
                    before clicking.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasResults && (
        <div className="text-center py-8">
          <p className="text-gray-600">
            Showing {video.length} results for "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResult;
