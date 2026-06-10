import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";
import video from "./Modals/video.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, ".env") });

const DNS_SERVERS = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (DNS_SERVERS.length > 0) {
  dns.setServers(DNS_SERVERS);
}

const verifyVideos = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 10000 });
    console.log("✅ Connected to MongoDB\n");

    const videoCount = await video.countDocuments();
    console.log(`📊 Total videos in database: ${videoCount}\n`);

    const allVideos = await video
      .find({})
      .sort({ seedOrder: 1, createdAt: -1 })
      .select("seedOrder videotitle videochannel filepath views");
    
    console.log("📹 Videos in database:\n");
    allVideos.forEach((v, index) => {
      console.log(`${v.seedOrder || index + 1}. ${v.videotitle}`);
      console.log(`   Channel: ${v.videochannel}`);
      console.log(`   Type: ${v.filepath.includes("youtube.com") ? "YouTube" : "Local"}`);
      console.log(`   Views: ${v.views.toLocaleString()}\n`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

verifyVideos();
