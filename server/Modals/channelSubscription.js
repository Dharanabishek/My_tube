import mongoose from "mongoose";

const channelSubSchema = mongoose.Schema(
  {
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true }
);

channelSubSchema.index({ channelId: 1, subscriberId: 1 }, { unique: true });

export default mongoose.model("channelSubscription", channelSubSchema);
