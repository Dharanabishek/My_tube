import express from "express";
import { login, requestOtp, updateprofile, verifyOtp } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/request-otp", requestOtp);
routes.post("/verify-otp", verifyOtp);
routes.patch("/update/:id", updateprofile);
export default routes;
