import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import fs from "fs";
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

const resolveUploadPath = (filepath) =>
  path.resolve(__dirname, filepath.replace(/^\/?uploads[\\/]/, "uploads/"));

const YOUR_VIDEOS = [
  {
    videotitle: "Aal Thotta Boopathy",
    filename: "Aal Thotta Boopathy.mp4",
    filepath: "uploads/Aal Thotta Boopathy.mp4",
    filetype: "video/mp4",
    filesize: "9.65MB",   
    duration: 240,
    videochannel: "Tamil Hits",
    like: 850000,
    views: 45000000,
    uploader: "tamilhits",
  },
  {
    videotitle: "Aale Saachuputta Kannala",
    filename: "Aale Saachuputta Kannala.mp4",
    filepath: "uploads/Aale Saachuputta Kannala.mp4",
    filetype: "video/mp4",
    filesize: "4.92MB",   
    duration: 260,
    videochannel: "Tamil Music",
    like: 1200000,
    views: 68000000,
    uploader: "tamilmusic",
  },
  {
    videotitle: "Amali Thumali",
    filename: "Amali Thumali.mp4",
    filepath: "uploads/Amali Thumali.mp4",
    filetype: "video/mp4",
    filesize: "5.20MB",   
    duration: 285,
    videochannel: "Sony Music South",
    like: 1800000,
    views: 120000000,
    uploader: "sonymusicsouth",
  },
  {
    videotitle: "Balleilakka",
    filename: "Balleilakka.mp4",
    filepath: "uploads/Balleilakka.mp4",
    filetype: "video/mp4",
    filesize: "5.17MB",   
    duration: 300,
    videochannel: "Sun Music",
    like: 1400000,
    views: 95000000,
    uploader: "sunmusic",
  },
  {
    videotitle: "Modern Building Architecture",
    filename: "building1.mp4",
    filepath: "uploads/building1.mp4",
    filetype: "video/mp4",
    filesize: "4.17MB",  
    duration: 90,
    videochannel: "Architecture World",
    like: 150000,
    views: 5000000,
    uploader: "architectureworld",
  },
  {
    videotitle: "City Skyline Timelapse",
    filename: "building2.mp4",
    filepath: "uploads/building2.mp4",
    filetype: "video/mp4",
    filesize: "4.24MB",   
    duration: 11,
    videochannel: "Urban View",
    like: 180000,
    views: 6200000,
    uploader: "urbanview",
  },
  {
    videotitle: "Coding Tutorial Part 1",
    filename: "coding1.mp4",
    filepath: "uploads/coding1.mp4",
    filetype: "video/mp4",
    filesize: "3.40MB",   
    duration: 14,
    videochannel: "Code Master",
    like: 420000,
    views: 15000000,
    uploader: "codemaster",
  },
  {
    videotitle: "Coding Tutorial Part 2",
    filename: "coding2.mp4",
    filepath: "uploads/coding2.mp4",
    filetype: "video/mp4",
    filesize: "3.94MB",   
    duration: 25,
    videochannel: "Code Master",
    like: 510000,
    views: 18000000,
    uploader: "codemaster",
  },
  {
    videotitle: "Naani Koni",
    filename: "Naani Koni.mp4",
    filepath: "uploads/Naani Koni.mp4",
    filetype: "video/mp4",
    filesize: "15.03MB",  
    duration: 5.5,
    videochannel: "Aditya Music",
    like: 1300000,
    views: 89000000,
    uploader: "adityamusic",
  },
  {
    videotitle: "Nature Documentary",
    filename: "nature1.mp4",
    filepath: "uploads/nature1.mp4",
    filetype: "video/mp4",
    filesize: "4.60MB",   
    duration: 5560,
    videochannel: "Nature World",
    like: 320000,
    views: 12000000,
    uploader: "natureworld",
  },
  {
    videotitle: "Beautiful Forest Views",
    filename: "nature2.mp4",
    filepath: "uploads/nature2.mp4",
    filetype: "video/mp4",
    filesize: "3.54MB",   
    duration: 5700,
    videochannel: "Nature World",
    like: 280000,
    views: 10000000,
    uploader: "natureworld",
  },
  {
    videotitle: "Natural Views",
    filename: "nature3.mp4",
    filepath: "uploads/nature3.mp4",
    filetype: "video/mp4",
    filesize: "4.55MB",   
    duration: 5700,
    videochannel: "Nature World",
    like: 280000,
    views: 10000000,
    uploader: "natureworld",
  },
];

const addVideos = async () => {
  try {
    const DBURL = process.env.DB_URL;

    if (!DBURL) {
      throw new Error("DB_URL is missing. Add it to My_tube/server/.env");
    }

    if (DBURL.includes("<db_password>") || DBURL.includes("YOUR_PASSWORD")) {
      throw new Error("Replace the password placeholder in My_tube/server/.env before running addVideos.js");
    }

    const missingVideos = YOUR_VIDEOS.filter(
      (item) => !fs.existsSync(resolveUploadPath(item.filepath))
    );
    if (missingVideos.length) {
      throw new Error(
        `Missing video file(s): ${missingVideos.map((item) => item.filepath).join(", ")}`
      );
    }

    await mongoose.connect(DBURL, { serverSelectionTimeoutMS: 10000 });
    console.log("✅ Connected to MongoDB");

    const seedVideos = YOUR_VIDEOS.map((item, index) => ({
      ...item,
      seedOrder: index + 1,
    }));
    const seedFilepaths = seedVideos.map((item) => item.filepath);

    // Add or update seed videos without deleting user uploads.
    await video.bulkWrite(
      seedVideos.map((item) => ({
        updateOne: {
          filter: {
            $or: [
              { filepath: item.filepath },
              { filename: item.filename },
              { videotitle: item.videotitle },
            ],
          },
          update: { $set: item },
          upsert: true,
        },
      }))
    );

    const staleVideos = await video.deleteMany({
      seedOrder: { $gt: 0 },
      filepath: { $nin: seedFilepaths },
    });

    console.log(`✅ Successfully synced ${YOUR_VIDEOS.length} videos to database`);
    console.log(`✅ Removed ${staleVideos.deletedCount} stale seeded videos`);

    const count = await video.countDocuments();
    console.log(`📊 Total videos in database: ${count}`);

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error adding videos:", error);
    process.exit(1);
  }
};

addVideos();
