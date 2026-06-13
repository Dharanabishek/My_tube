import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import paymentroutes from "./routes/payment.js";
import downloadroutes from "./routes/download.js";
import channelroutes from "./routes/channel.js";
import streamroutes from "./routes/stream.js";
import collaborationroutes from "./routes/collaboration.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, ".env") });
const app = express();

const PORT = process.env.PORT || 5000;
const DBURL = process.env.DB_URL;
const MONGO_AUTH_SOURCE = process.env.MONGO_AUTH_SOURCE || "admin";
const DNS_SERVERS = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (DNS_SERVERS.length > 0) {
  dns.setServers(DNS_SERVERS);
}

if (!DBURL) {
  console.error("DB_URL is missing. Add it to My_tube/server/.env");
  process.exit(1);
}

if (DBURL.includes("<db_password>") || DBURL.includes("YOUR_PASSWORD")) {
  console.error("Replace the password placeholder in My_tube/server/.env before starting the server.");
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/payment", paymentroutes);
app.use("/download", downloadroutes);
app.use("/channel", channelroutes);
app.use("/stream", streamroutes);
app.use("/collaboration", collaborationroutes);
const mongoOptions = { serverSelectionTimeoutMS: 10000 };
if (MONGO_AUTH_SOURCE && !DBURL.includes("authSource=")) {
  mongoOptions.authSource = MONGO_AUTH_SOURCE;
}

mongoose
  .connect(DBURL, mongoOptions)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
