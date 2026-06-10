import express from "express";
import {
  createOrder,
  getPaymentsForUser,
  getSubscriptionForUser,
  mockSubscribe,
  verifyPayment,
} from "../controllers/payment.js";

const routes = express.Router();

routes.post("/create-order", createOrder);
routes.post("/verify", verifyPayment);
routes.post("/mock-subscribe", mockSubscribe);
routes.get("/user/:id", getPaymentsForUser);
routes.get("/subscription/:id", getSubscriptionForUser);

export default routes;
