import mongoose from "mongoose";
import CollaborationSignal from "../Modals/collaborationSignal.js";

function isValidRoomId(roomId = "") {
  return /^[a-zA-Z0-9_-]{3,80}$/.test(roomId);
}

export const postSignal = async (req, res) => {
  const { roomId } = req.params;
  const { senderId, type, payload } = req.body;

  if (!isValidRoomId(roomId)) {
    return res.status(400).json({ message: "Invalid room id" });
  }

  if (!mongoose.Types.ObjectId.isValid(senderId)) {
    return res.status(400).json({ message: "Invalid sender id" });
  }

  if (!["offer", "answer", "ice-candidate", "chat", "hangup"].includes(type)) {
    return res.status(400).json({ message: "Invalid signal type" });
  }

  try {
    const signal = await CollaborationSignal.create({
      roomId,
      senderId,
      type,
      payload,
      readBy: [senderId],
    });

    return res.status(201).json(signal);
  } catch (error) {
    console.error("postSignal error:", error);
    return res.status(500).json({ message: "Could not post signal" });
  }
};

export const getSignals = async (req, res) => {
  const { roomId } = req.params;
  const { userId, since } = req.query;

  if (!isValidRoomId(roomId)) {
    return res.status(400).json({ message: "Invalid room id" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const query = {
      roomId,
      senderId: { $ne: userId },
    };

    if (since) {
      query.createdAt = { $gt: new Date(String(since)) };
    }

    const signals = await CollaborationSignal.find(query)
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return res.status(200).json(signals);
  } catch (error) {
    console.error("getSignals error:", error);
    return res.status(500).json({ message: "Could not load signals" });
  }
};
