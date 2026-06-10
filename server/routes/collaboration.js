import express from "express";
import { getSignals, postSignal } from "../controllers/collaboration.js";

const routes = express.Router();

routes.get("/:roomId/signals", getSignals);
routes.post("/:roomId/signals", postSignal);

export default routes;
