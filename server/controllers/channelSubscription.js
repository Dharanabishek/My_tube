import mongoose from "mongoose";
import ChannelSubscription from "../Modals/channelSubscription.js";

export const toggleSubscription = async (req, res) => {
  try {
    const { userId, channelId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(channelId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid IDs",
      });
    }

    if (userId === channelId) {
      return res.status(400).json({
        success: false,
        message: "Cannot subscribe yourself",
      });
    }

    const existing = await ChannelSubscription.findOne({
      channelId,
      subscriberId: userId,
    });

    let subscribed = false;

    if (existing) {
      await ChannelSubscription.deleteOne({
        _id: existing._id,
      });

      subscribed = false;
    } else {
      await ChannelSubscription.create({
        channelId,
        subscriberId: userId,
      });

      subscribed = true;
    }

    const subscribersCount =
      await ChannelSubscription.countDocuments({
        channelId,
      });

    res.status(200).json({
      success: true,
      subscribed,
      subscribersCount,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getChannelSubscriptionStatus = async (
  req,
  res
) => {
  try {
    const { channelId, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(channelId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid IDs",
      });
    }

    const existing = await ChannelSubscription.findOne({
      channelId,
      subscriberId: userId,
    });

    const subscribersCount =
      await ChannelSubscription.countDocuments({
        channelId,
      });

    res.status(200).json({
      success: true,
      subscribed: !!existing,
      subscribersCount,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};