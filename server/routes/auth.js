import express from "express";
import { getAccessTheme, login, refreshTheme, requestOtp, updateprofile, verifyOtp } from "../controllers/auth.js";
import jwtAuth from "../middleware/jwtAuth.js";
const routes = express.Router();

routes.post("/access-theme", getAccessTheme);
routes.post("/login", login);
routes.post("/request-otp", requestOtp);
routes.post("/verify-otp", verifyOtp);
routes.post("/refresh-theme", jwtAuth, refreshTheme);
routes.patch("/update/:id", updateprofile);
export default routes;
