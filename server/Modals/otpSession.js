import mongoose from "mongoose";

const otpSessionSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    otpHash: { type: String, required: true },
    channel: { type: String, enum: ["email", "mobile"], required: true },
    target: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date },
  },
  { timestamps: true }
);

otpSessionSchema.index({ userId: 1, createdAt: -1 });
otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("otpSession", otpSessionSchema);
