import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Clock, Share2, Download, MoreVertical } from 'lucide-react';
import { Button } from './button';

interface VideoActionsProps {
  videoId?: string;
  onSubscribe?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onWatchLater?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  likeCount?: number;
  dislikeCount?: number;
  isSubscribed?: boolean;
}

export const VideoActions: React.FC<VideoActionsProps> = ({
  onSubscribe,
  onLike,
  onDislike,
  onWatchLater,
  onShare,
  onDownload,
  likeCount = 0,
  dislikeCount = 0,
  isSubscribed = false,
}) => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
    onLike?.();
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
    onDislike?.();
  };

  return (
    <div className="flex items-center gap-3 py-4 border-b">
      {/* Left: small black subscribe pill */}
      <Button
        className="bg-black text-white hover:bg-gray-900 rounded-full px-4 py-2 font-medium shadow-sm"
        onClick={onSubscribe}
      >
        {isSubscribed ? 'Subscribed' : 'Subscribe'}
      </Button>

      {/* Like/Dislike grouped pill */}
      <div className="flex items-center bg-gray-100 rounded-full overflow-hidden divide-x divide-gray-300 shadow-sm">
        <button onClick={handleLike} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-200">
          <ThumbsUp size={16} className={`${liked ? 'text-blue-600' : 'text-gray-700'}`} />
          <span className="font-medium">{likeCount?.toLocaleString()}</span>
        </button>
        <button onClick={handleDislike} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-200">
          <ThumbsDown size={16} className={`${disliked ? 'text-blue-600' : 'text-gray-700'}`} />
          <span className="font-medium">{dislikeCount?.toLocaleString()}</span>
        </button>
      </div>

      {/* Other actions as small pills */}
      <div className="flex items-center gap-2 ml-2">
        <Button variant="ghost" className="gap-2 hover:bg-gray-100 rounded-full px-3 py-2">
          <Clock size={16} />
          <span className="hidden sm:inline text-sm">Watch Later</span>
        </Button>

        <Button variant="ghost" className="gap-2 hover:bg-gray-100 rounded-full px-3 py-2" onClick={onShare}>
          <Share2 size={16} />
          <span className="hidden sm:inline text-sm">Share</span>
        </Button>

        <Button variant="ghost" className="gap-2 hover:bg-gray-100 rounded-full px-3 py-2" onClick={onDownload}>
          <Download size={16} />
          <span className="hidden sm:inline text-sm">Download</span>
        </Button>

        <Button variant="ghost" size="sm" className="ml-auto hover:bg-gray-100 rounded-full p-2">
          <MoreVertical size={18} />
        </Button>
      </div>
    </div>
  );
};

export default VideoActions;
