import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!channel?._id) return;
    const fetchStatus = async () => {
      try {
        const userId = user?._id || "guest";
        const res = await axiosInstance.get(`/channel/status/${channel._id}/${userId}`);
        setIsSubscribed(res.data.subscribed);
        setSubscriberCount(res.data.subscribersCount || 0);
      } catch (err) {
        console.error("Error loading subscription status:", err);
      }
    };
    fetchStatus();
  }, [channel?._id, user?._id]);

  const handleSubscribeToggle = async () => {
    if (!user?._id || !channel?._id || isSaving) return;
    try {
      setIsSaving(true);
      const res = await axiosInstance.post("/channel/toggle", {
        userId: user._id,
        channelId: channel._id,
      });
      setIsSubscribed(res.data.subscribed);
      setSubscriberCount(res.data.subscribersCount || 0);
    } catch (err) {
      console.error("Error toggling subscription:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>

      {/* Channel Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-20 h-20 md:w-32 md:h-32">
            <AvatarFallback className="text-2xl">
              {channel?.channelname?.[0]?.toUpperCase() || channel?.name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">{channel?.channelname || channel?.name || "Channel"}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>@{channel?.channelname?.toLowerCase().replace(/\s+/g, "") || channel?.name?.toLowerCase().replace(/\s+/g, "") || "channel"}</span>
              <span>&bull;</span>
              <span>{subscriberCount.toLocaleString()} {subscriberCount === 1 ? "subscriber" : "subscribers"}</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-gray-700 max-w-2xl">
                {channel?.description}
              </p>
            )}
          </div>

          {user && user?._id !== channel?._id && (
            <div className="flex gap-2">
              <Button
                onClick={handleSubscribeToggle}
                disabled={isSaving}
                variant={isSubscribed ? "outline" : "default"}
                className={
                  isSubscribed ? "bg-gray-100" : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
