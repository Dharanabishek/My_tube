import mongoose from "mongoose";
import Download from "../Modals/download.js";
import Video from "../Modals/video.js";
import { getActivePlan, getPlanDetails } from "../utils/plans.js";
import { getMimeType, resolveVideoFilePath } from "../utils/videoFile.js";

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// CREATE DOWNLOAD
export const createDownload = async (req, res) => {
  try {
    const { userId, videoId } = req.body;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(videoId)
    ) {
      return res.status(400).json({
        message: "Invalid userId or videoId",
      });
    }

    const effectivePlan = await getActivePlan(userId);
    const planDetails = getPlanDetails(effectivePlan);

    // Check if same video already downloaded today
    const existing = await Download.findOne({
      userId,
      videoId,
      downloadDate: {
        $gte: startOfDay(),
      },
    });

    // Update existing record
    if (existing) {
      existing.downloadCount =
        (existing.downloadCount || 1) + 1;

      existing.downloadDate = new Date();

      existing.planType = effectivePlan;

      await existing.save();

      return res.status(200).json(existing);
    }

    // FREE USER LIMIT
    if (planDetails.downloadLimitPerDay !== null) {
      const downloadsToday = await Download.countDocuments({
        userId,
        downloadDate: {
          $gte: startOfDay(),
        },
      });

      if (downloadsToday >= planDetails.downloadLimitPerDay) {
        return res.status(429).json({
          message:
            "Daily download limit reached. Upgrade to premium for unlimited downloads.",
          code: "LIMIT_REACHED",
        });
      }
    }

    // Create new download
    const newDownload = await Download.create({
      userId,
      videoId,
      planType: effectivePlan,
      downloadCount: 1,
    });

    return res.status(201).json(newDownload);
  } catch (error) {
    console.error("createDownload error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

// GET USER DOWNLOADS
export const getUserDownloads = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    if (requesterId && requesterId !== id) {
      return res.status(403).json({
        message: "You can only view your own downloads.",
      });
    }

    const list = await Download.find({
      userId: id,
    })
      .populate("videoId")
      .sort({ downloadDate: -1 });

    return res.status(200).json(list);
  } catch (error) {
    console.error("getUserDownloads error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

// GET ALL DOWNLOADS (ADMIN)
export const getAllDownloads = async (req, res) => {
  try {
    const list = await Download.find()
      .populate("videoId")
      .populate("userId", "name email")
      .sort({ downloadDate: -1 });

    return res.status(200).json(list);
  } catch (error) {
    console.error("getAllDownloads error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const downloadVideoFile = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(videoId)
    ) {
      return res.status(400).json({ message: "Invalid userId or videoId" });
    }

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (/^https?:\/\//i.test(video.filepath)) {
      return res.status(400).json({
        message: "External videos cannot be downloaded directly from this server.",
      });
    }

    const filePath = resolveVideoFilePath(video.filepath);
    if (!filePath) {
      return res.status(404).json({ message: "Video file not found" });
    }

    const recordResponse = {
      body: { userId, videoId },
    };

    let recordPayload;
    const fakeRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        recordPayload = { statusCode: this.statusCode || 200, payload };
        return payload;
      },
    };
    await createDownload(recordResponse, fakeRes);

    if (recordPayload?.statusCode >= 400) {
      return res.status(recordPayload.statusCode).json(recordPayload.payload);
    }

    res.download(filePath, video.filename || `${video.videotitle}.mp4`, {
      headers: {
        "Content-Type": getMimeType(filePath),
      },
    });
  } catch (error) {
    console.error("downloadVideoFile error:", error);
    return res.status(500).json({ message: "Download failed" });
  }
};
