import express from "express";
import {
  createOrder,
  getPaymentsForUser,
  getSubscriptionForUser,
  mockSubscribe,
  verifyPayment,
} from "../controllers/payment.js";
import jwtAuth from "../middleware/jwtAuth.js";

const routes = express.Router();

routes.post("/create-order", jwtAuth, createOrder);
routes.post("/verify", jwtAuth, verifyPayment);
routes.post("/mock-subscribe", jwtAuth, mockSubscribe);
routes.get("/user/:id", jwtAuth, getPaymentsForUser);
routes.get("/subscription/:id", jwtAuth, getSubscriptionForUser);

export default routes;
