import mongoose from "mongoose";
import video from "../Modals/video.js";
import history from "../Modals/history.js";

export const handlehistory = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  try {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(videoId)
    ) {
      return res.status(400).json({ message: "Invalid user or video id" });
    }

    const updatedVideo = await video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    const existingHistory = await history.findOne({
      viewer: userId,
      videoid: videoId,
    });

    if (existingHistory) {
      existingHistory.updatedAt = new Date();
      await existingHistory.save();
    } else {
      await history.create({ viewer: userId, videoid: videoId });
    }

    return res.status(200).json({ history: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const handleview = async (req, res) => {
  const { videoId } = req.params;
  try {
    const updatedVideo = await video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    );
    return res.status(200).json({ views: updatedVideo?.views || 0 });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallhistoryVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const historyvideo = await history
      .find({ viewer: userId })
      .sort({ updatedAt: -1 })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();

    const seenVideos = new Set();
    const uniqueHistory = historyvideo.filter((item) => {
      if (!item.videoid) return false;

      const videoKey = item.videoid._id.toString();
      if (seenVideos.has(videoKey)) return false;

      seenVideos.add(videoKey);
      return true;
    });

    return res.status(200).json(uniqueHistory);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removehistoryVideo = async (req, res) => {
  const { historyId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({ message: "Invalid history id" });
    }

    const historyItem = await history.findById(historyId);
    if (!historyItem) {
      return res.status(404).json({ message: "History item not found" });
    }

    await history.deleteMany({
      viewer: historyItem.viewer,
      videoid: historyItem.videoid,
    });

    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
