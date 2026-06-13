import express from "express";
import { getSignals, postSignal } from "../controllers/collaboration.js";
import jwtAuth from "../middleware/jwtAuth.js";

const routes = express.Router();

routes.get("/:roomId/signals", jwtAuth, getSignals);
routes.post("/:roomId/signals", jwtAuth, postSignal);

export default routes;
