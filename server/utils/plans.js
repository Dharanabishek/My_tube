import Subscription from "../Modals/subscription.js";

export const PLAN_LIMITS = {
  Free: { price: 0, watchLimitSeconds: 5 * 60, downloadLimitPerDay: 1 },
  Bronze: { price: 10, watchLimitSeconds: 7 * 60, downloadLimitPerDay: null },
  Silver: { price: 50, watchLimitSeconds: 10 * 60, downloadLimitPerDay: null },
  Gold: { price: 100, watchLimitSeconds: null, downloadLimitPerDay: null },
};

export const PAID_PLANS = ["Bronze", "Silver", "Gold"];

export function normalizePlan(planType = "Free") {
  return PLAN_LIMITS[planType] ? planType : "Free";
}

export async function getActivePlan(userId) {
  if (!userId) return "Free";

  const now = new Date();
  const subscription = await Subscription.findOne({
    userId,
    status: "active",
    $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gt: now } }],
  })
    .sort({ createdAt: -1 })
    .lean();

  return normalizePlan(subscription?.planType || "Free");
}

export function getPlanDetails(planType = "Free") {
  const normalizedPlan = normalizePlan(planType);
  return {
    planType: normalizedPlan,
    ...PLAN_LIMITS[normalizedPlan],
  };
}
