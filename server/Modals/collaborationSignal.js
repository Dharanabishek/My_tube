import mongoose from "mongoose";

const collaborationSignalSchema = mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    type: {
      type: String,
      enum: ["offer", "answer", "ice-candidate", "chat", "hangup"],
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true }
);

collaborationSignalSchema.index({ roomId: 1, createdAt: -1 });
collaborationSignalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.model("collaborationSignal", collaborationSignalSchema);
