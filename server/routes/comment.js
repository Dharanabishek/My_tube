import express from "express";
import {
  deletecomment,
  editcomment,
  getallcomment,
  postcomment,
  reactcomment,
  translatecomment,
} from "../controllers/comment.js";


const routes = express.Router();
routes.get("/:videoid", getallcomment);
routes.post("/postcomment", postcomment);
routes.post("/translate", translatecomment);
routes.post("/reactcomment/:id", reactcomment);
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id", editcomment);
export default routes;
