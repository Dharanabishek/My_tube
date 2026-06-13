import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../Modals/paymentHistory.js";
import Subscription from "../Modals/subscription.js";
import users from "../Modals/Auth.js";
import { generateInvoiceHTML } from "../emailTemplates/invoiceTemplate.js";
import { getActivePlan, getPlanDetails, PAID_PLANS, PLAN_LIMITS } from "../utils/plans.js";
import { sendEmail } from "../services/notification.js";
import mongoose from "mongoose";

let razorpay = null;
let cachedKeyId = null;
let cachedKeySecret = null;

function getRazorpayConfig() {
  const keyId = (process.env.RZP_KEY_ID || process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RZP_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "").trim();
  const missing = [];

  if (!keyId) missing.push("RZP_KEY_ID or RAZORPAY_KEY_ID");
  if (!keySecret) missing.push("RZP_KEY_SECRET or RAZORPAY_KEY_SECRET");

  return { keyId, keySecret, missing };
}

function getRazorpayClient() {
  const { keyId, keySecret, missing } = getRazorpayConfig();
  if (missing.length > 0) {
    return { client: null, keyId: null, keySecret: null, missing };
  }

  if (!razorpay || cachedKeyId !== keyId || cachedKeySecret !== keySecret) {
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    cachedKeyId = keyId;
    cachedKeySecret = keySecret;
  }

  return { client: razorpay, keyId, keySecret, missing: [] };
}

const planPrices = Object.fromEntries(
  PAID_PLANS.map((planType) => [planType, PLAN_LIMITS[planType].price])
);

function getAuthorizedUserId(req, res, requestedUserId) {
  const userId = requestedUserId || req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid user id" });
    return null;
  }

  if (req.user?.id !== userId) {
    res.status(403).json({ message: "You can only access your own subscription data." });
    return null;
  }

  return userId;
}

export const createOrder = async (req, res) => {
  try {
    const { client, keyId, missing } = getRazorpayClient();
    if (!client) {
      return res.status(500).json({
        message: `Payment provider not configured. Missing ${missing.join(" and ")} in server/.env`,
      });
    }

    const { planType, userId } = req.body;
    const authorizedUserId = getAuthorizedUserId(req, res, userId);
    if (!authorizedUserId) return;

    if (!planType || !PAID_PLANS.includes(planType)) {
      return res.status(400).json({ message: "Invalid planType" });
    }

    const user = await users.findById(authorizedUserId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const amount = (planPrices[planType] || 0) * 100; // paise
    const options = {
      amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };
    const order = await client.orders.create(options);
    // Create payment record
    const payment = await Payment.create({ userId: authorizedUserId, planType, amount: amount / 100, orderId: order.id, currency: "INR", status: "created" });
    return res.status(201).json({ order, payment, keyId });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ message: "Could not create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planType } = req.body;
    const { keySecret, missing } = getRazorpayConfig();
    if (!keySecret) {
      return res.status(500).json({
        message: `Payment provider not configured. Missing ${missing.join(" and ")} in server/.env`,
      });
    }
    const authorizedUserId = getAuthorizedUserId(req, res, userId);
    if (!authorizedUserId) return;

    if (!planType || !PAID_PLANS.includes(planType)) {
      return res.status(400).json({ message: "Invalid planType" });
    }

    const existingPayment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!existingPayment) {
      return res.status(404).json({ message: "Payment order not found" });
    }

    if (String(existingPayment.userId) !== authorizedUserId) {
      return res.status(403).json({ message: "Payment order does not belong to this user" });
    }

    if (existingPayment.planType !== planType) {
      return res.status(400).json({ message: "Plan does not match the payment order" });
    }

    if (existingPayment.status === "paid") {
      return res.status(200).json({ message: "Payment already verified", payment: existingPayment });
    }

    const generated_signature = crypto.createHmac("sha256", keySecret).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // update payment record
    const payment = await Payment.findOneAndUpdate({ orderId: razorpay_order_id }, { paymentId: razorpay_payment_id, signature: razorpay_signature, status: "paid", invoiceId: `INV-${Date.now()}` }, { new: true });

    // create/extend subscription
    const price = existingPayment.amount;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    await Subscription.create({ userId: authorizedUserId, planType: existingPayment.planType, startDate, endDate, paymentId: razorpay_payment_id, status: "active" });

    // send invoice email
    try {
      const user = await users.findById(authorizedUserId);
      if (user && user.email) {
        const html = generateInvoiceHTML({
          invoiceId: payment?.invoiceId,
          planName: existingPayment.planType,
          amount: price,
          date: new Date().toLocaleString(),
          user,
          paymentId: razorpay_payment_id,
        });
        await sendEmail({
          to: user.email,
          subject: `Invoice ${payment?.invoiceId} - ${existingPayment.planType}`,
          html,
        });
      }
    } catch (mailErr) {
      console.error("Invoice email failed:", mailErr);
    }

    return res.status(200).json({ message: "Payment verified", payment });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ message: "Verification failed" });
  }
};

export const getPaymentsForUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getAuthorizedUserId(req, res, id);
    if (!userId) return;

    const list = await Payment.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(list);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const mockSubscribe = async (req, res) => {
  try {
    // Allow mock subscriptions when Razorpay isn't configured OR when explicitly allowed
    const { client } = getRazorpayClient();
    if (client && process.env.ALLOW_MOCK_PAYMENTS !== "true") {
      return res.status(400).json({ message: "Mock subscriptions are disabled" });
    }
    const { planType, userId } = req.body;
    const authorizedUserId = getAuthorizedUserId(req, res, userId);
    if (!authorizedUserId) return;

    if (!planType || !PAID_PLANS.includes(planType)) {
      return res.status(400).json({ message: "Invalid planType" });
    }

    const user = await users.findById(authorizedUserId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const price = planPrices[planType] || 0;
    const paymentId = `mock_${Date.now()}`;
    const invoiceId = `INV-${Date.now()}`;
    const payment = await Payment.create({ userId: authorizedUserId, planType, amount: price, orderId: paymentId, paymentId, currency: "INR", status: "paid", invoiceId });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    await Subscription.create({ userId: authorizedUserId, planType, startDate, endDate, paymentId, status: "active" });

    // send invoice email if possible
    try {
      if (user && user.email) {
        const html = generateInvoiceHTML({
          invoiceId,
          planName: planType,
          amount: price,
          date: new Date().toLocaleString(),
          user,
          paymentId,
        });
        await sendEmail({
          to: user.email,
          subject: `Invoice ${invoiceId} - ${planType}`,
          html,
        });
      }
    } catch (mailErr) {
      console.error("Invoice email (mock) failed:", mailErr);
    }

    return res.status(200).json({ message: "Mock subscription created", payment });
  } catch (err) {
    console.error("mockSubscribe error:", err);
    return res.status(500).json({ message: "Could not create mock subscription" });
  }
};

export const getSubscriptionForUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getAuthorizedUserId(req, res, id);
    if (!userId) return;

    const planType = await getActivePlan(userId);
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
      $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gt: new Date() } }],
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      ...getPlanDetails(planType),
      subscription,
    });
  } catch (error) {
    console.error("getSubscriptionForUser error:", error);
    return res.status(500).json({ message: "Could not load subscription" });
  }
};
