import express from "express";
import {
  getallhistoryVideo,
  handlehistory,
  handleview,
  removehistoryVideo,
} from "../controllers/history.js";

const routes = express.Router();
routes.get("/:userId", getallhistoryVideo);
routes.delete("/:historyId", removehistoryVideo);
routes.post("/views/:videoId", handleview);
routes.post("/:videoId", handlehistory);
export default routes;
