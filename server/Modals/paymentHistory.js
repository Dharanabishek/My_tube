import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    planType: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    invoiceId: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ orderId: 1 });

export default mongoose.model("payment", paymentSchema);
