import mongoose from "mongoose";
import dotenv from "dotenv";
import video from "./Modals/video.js";

dotenv.config();

const verifyVideos = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Connected to MongoDB\n");

    const videoCount = await video.countDocuments();
    console.log(`📊 Total videos in database: ${videoCount}\n`);

    const allVideos = await video.find({}).select("videotitle videochannel filepath views");
    
    console.log("📹 Videos in database:\n");
    allVideos.forEach((v, index) => {
      console.log(`${index + 1}. ${v.videotitle}`);
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
