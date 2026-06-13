import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import OtpSession from "../Modals/otpSession.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail, sendSms } from "../services/notification.js";

const SOUTH_INDIAN_STATES = new Set([
  "tamil nadu",
  "kerala",
  "karnataka",
  "andhra pradesh",
  "telangana",
]);

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);

export function normalizeState(state = "") {
  return state
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function isSouthIndianState(state = "") {
  const normalizedState = normalizeState(state);
  return SOUTH_INDIAN_STATES.has(normalizedState);
}

export function isLightThemeWindow(date = new Date()) {
  const istDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const hour = istDate.getHours();
  return hour >= 10 && hour < 12;
}

export function getThemeForLogin(state, date = new Date()) {
  return isSouthIndianState(state) && isLightThemeWindow(date) ? "light" : "dark";
}

function maskTarget(target = "", channel = "email") {
  if (channel === "mobile") {
    return target.length > 4 ? `******${target.slice(-4)}` : "registered mobile";
  }
  const [name, domain] = target.split("@");
  if (!domain) return "registered email";
  return `${name.slice(0, 2)}***@${domain}`;
}

function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(`${otp}:${process.env.OTP_HASH_SECRET || JWT_SECRET}`)
    .digest("hex");
}

function createOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function signUser(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function createAndSendOtp(user, channel) {
  const target = channel === "mobile" ? user.mobile : user.email;
  if (!target) {
    return {
      ok: false,
      code: channel === "mobile" ? "MOBILE_REQUIRED" : "EMAIL_REQUIRED",
      message:
        channel === "mobile"
          ? "Registered mobile number is required for this region."
          : "Registered email is required.",
    };
  }

  const otp = createOtp();
  await OtpSession.create({
    userId: user._id,
    otpHash: hashOtp(otp),
    channel,
    target,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
  });

  const text = `Your My Tube login OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`;
  if (channel === "mobile") {
    await sendSms({ to: target, message: text });
  } else {
    await sendEmail({
      to: target,
      subject: "Your My Tube login OTP",
      text,
      html: `<p>${text}</p>`,
    });
  }

  return { ok: true, maskedTarget: maskTarget(target, channel) };
}

export const login = async (req, res) => {
  const { email, name, image, mobile, city, state } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const theme = getThemeForLogin(state);
    const otpChannel = isSouthIndianState(state) ? "email" : "mobile";
    const updates = {
      name,
      image,
      city,
      state,
      mobile,
      lastLoginAt: new Date(),
      lastLoginTheme: theme,
      otpChannel,
    };

    const user = await users.findOneAndUpdate(
      { email },
      { $set: updates, $setOnInsert: { email } },
      { new: true, upsert: true }
    );

    const otpResult = await createAndSendOtp(user, otpChannel);
    if (!otpResult.ok) {
      return res.status(202).json({
        requiresMobile: otpResult.code === "MOBILE_REQUIRED",
        userId: user._id,
        result: user,
        theme,
        otpChannel,
        message: otpResult.message,
      });
    }

    return res.status(200).json({
      requiresOtp: true,
      userId: user._id,
      theme,
      otpChannel,
      maskedTarget: otpResult.maskedTarget,
      message: `OTP sent to your ${otpChannel}.`,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const requestOtp = async (req, res) => {
  const { userId, mobile, state, city } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User unavailable" });

    if (mobile) user.mobile = mobile;
    if (state) user.state = state;
    if (city) user.city = city;

    const channel = isSouthIndianState(user.state) ? "email" : "mobile";
    user.otpChannel = channel;
    user.lastLoginTheme = getThemeForLogin(user.state);
    await user.save();

    const otpResult = await createAndSendOtp(user, channel);
    if (!otpResult.ok) {
      return res.status(400).json({ message: otpResult.message });
    }

    return res.status(200).json({
      requiresOtp: true,
      userId: user._id,
      theme: user.lastLoginTheme,
      otpChannel: channel,
      maskedTarget: otpResult.maskedTarget,
      message: `OTP sent to your ${channel}.`,
    });
  } catch (error) {
    console.error("requestOtp error:", error);
    return res.status(500).json({ message: "Could not send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId) || !String(otp || "").trim()) {
    return res.status(400).json({ message: "User id and OTP are required" });
  }

  try {
    const session = await OtpSession.findOne({
      userId,
      consumedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!session) {
      return res.status(400).json({ message: "OTP expired. Request a new OTP." });
    }

    if (session.attempts >= 5) {
      return res.status(429).json({ message: "Too many OTP attempts." });
    }

    session.attempts += 1;
    if (session.otpHash !== hashOtp(String(otp).trim())) {
      await session.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    session.consumedAt = new Date();
    await session.save();

    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User unavailable" });

    const token = signUser(user);
    return res.status(200).json({
      token,
      result: user,
      theme: user.lastLoginTheme || "dark",
      message: "OTP verified",
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

export const getAccessTheme = async (req, res) => {
  const { state } = req.body;
  const theme = getThemeForLogin(state);

  return res.status(200).json({
    theme,
    state,
    isSouthIndia: isSouthIndianState(state),
    isLightThemeWindow: isLightThemeWindow(),
  });
};

export const refreshTheme = async (req, res) => {
  const userId = req.user?.id;
  const { city, state } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User unavailable" });

    if (city) user.city = city;
    if (state) user.state = state;

    const theme = getThemeForLogin(user.state);
    user.lastLoginTheme = theme;
    await user.save();

    return res.status(200).json({
      theme,
      state: user.state,
      city: user.city,
      isSouthIndia: isSouthIndianState(user.state),
      isLightThemeWindow: isLightThemeWindow(),
    });
  } catch (error) {
    console.error("refreshTheme error:", error);
    return res.status(500).json({ message: "Could not refresh theme" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description, mobile, city, state } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
          mobile: mobile,
          city: city,
          state: state,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
