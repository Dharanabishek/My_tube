import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    planType: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], default: "Free" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    paymentId: { type: String },
    status: { type: String, enum: ["active", "inactive", "cancelled"], default: "active" },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ userId: 1 });

export default mongoose.model("subscription", subscriptionSchema);
