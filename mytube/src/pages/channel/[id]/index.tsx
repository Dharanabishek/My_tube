import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchChannelData = async () => {
      try {
        setLoading(true);
        // Fetch channel user profile
        const profileRes = await axiosInstance.get(`/user/profile/${id}`);
        setChannel(profileRes.data);

        // Fetch all videos and filter by uploader matching this channel's ID
        const videosRes = await axiosInstance.get("/video/getall");
        const channelVideos = videosRes.data.filter((vid: any) => vid.uploader === id);
        setVideos(channelVideos);
      } catch (error) {
        console.error("Error fetching channel data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannelData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-medium text-gray-500">Loading channel...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-medium text-red-500">Channel not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-white">
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={channel} user={user} />
        <Channeltabs />
        {user && user._id === id && (
          <div className="px-4 pb-8">
            <VideoUploader channelId={id} channelName={channel?.channelname || channel?.name} />
          </div>
        )}
        <div className="px-4 pb-8">
          <ChannelVideos videos={videos} />
        </div>
      </div>
    </div>
  );
};

export default index;
