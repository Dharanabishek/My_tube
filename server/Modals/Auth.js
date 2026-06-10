import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  mobile: { type: String },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  city: { type: String },
  state: { type: String },
  lastLoginAt: { type: Date },
  lastLoginTheme: { type: String, enum: ["light", "dark"], default: "dark" },
  otpChannel: { type: String, enum: ["email", "mobile"] },
  joinedon: { type: Date, default: Date.now },
});

export default mongoose.model("user", userschema);
