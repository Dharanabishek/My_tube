import mongoose from "mongoose";
import video from "../Modals/video.js";
import like from "../Modals/like.js";

export const handlelike = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  try {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(videoId)
    ) {
      return res.status(400).json({ message: "Invalid user or video id" });
    }

    const existingVideo = await video.findById(videoId);
    if (!existingVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    const exisitinglike = await like.findOne({
      viewer: userId,
      videoid: videoId,
    });
    if (exisitinglike) {
      await like.deleteMany({ viewer: userId, videoid: videoId });
      await video.findByIdAndUpdate(videoId, { $inc: { like: -1 } });
      return res.status(200).json({ liked: false });
    } else {
      await like.create({ viewer: userId, videoid: videoId });
      await video.findByIdAndUpdate(videoId, { $inc: { like: 1 } });
      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallLikedVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const likevideo = await like
      .find({ viewer: userId })
      .sort({ updatedAt: -1 })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();

    const seenVideos = new Set();
    const uniqueLikedVideos = likevideo.filter((item) => {
      if (!item.videoid) return false;

      const videoKey = item.videoid._id.toString();
      if (seenVideos.has(videoKey)) return false;

      seenVideos.add(videoKey);
      return true;
    });

    return res.status(200).json(uniqueLikedVideos);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
