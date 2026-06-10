import mongoose from "mongoose";

const downloadSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "videofiles", required: true },
    downloadDate: { type: Date, default: Date.now },
    downloadCount: { type: Number, default: 1 },
    planType: { type: String, default: "Free" },
  },
  {
    timestamps: true,
  }
);

downloadSchema.index({ userId: 1, videoId: 1 });
downloadSchema.index({ userId: 1, downloadDate: 1 });

export default mongoose.model("download", downloadSchema);
