import express from "express";

import {
  toggleSubscription,
  getChannelSubscriptionStatus,
} from "../controllers/channelSubscription.js";

const routes = express.Router();

// Subscribe / Unsubscribe Toggle
routes.post("/toggle", toggleSubscription);

// Get subscription status + subscriber count
routes.get(
  "/status/:channelId/:userId",
  getChannelSubscriptionStatus
);

export default routes;