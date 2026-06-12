import express from "express";
import {
  createDownload,
  downloadVideoFile,
  getAllDownloads,
  getUserDownloads,
} from "../controllers/download.js";
import jwtAuth from "../middleware/jwtAuth.js";

const routes = express.Router();

routes.post("/create", createDownload);
routes.get("/file/:videoId", jwtAuth, downloadVideoFile);
routes.get("/user/:id", jwtAuth, getUserDownloads);
routes.get("/all", getAllDownloads);

export default routes;
