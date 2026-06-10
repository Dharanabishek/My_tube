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

// Replace this array with YOUR YouTube videos
const YOUR_VIDEOS = [
  {
    videotitle: "Arabic Kuthu - Beast",
    filename: "arabic-kuthu.mp4",
    filepath: "https://www.youtube.com/embed/KUN5Uf9mObQ",
    filetype: "video/mp4",
    filesize: "120MB",
    duration: 290,
    videochannel: "Sun TV",
    like: 5200000,
    views: 650000000,
    uploader: "suntv"
},
{
    videotitle: "Vaathi Coming - Master",
    filename: "vaathi-coming.mp4",
    filepath: "https://www.youtube.com/embed/fRD_3vJagxk",
    filetype: "video/mp4",
    filesize: "110MB",
    duration: 230,
    videochannel: "Sony Music South",
    like: 4800000,
    views: 550000000,
    uploader: "sonymusicsouth"
},
{
    videotitle: "Enjoy Enjaami",
    filename: "enjoy-enjaami.mp4",
    filepath: "https://www.youtube.com/embed/eYq7WapuDLU",
    filetype: "video/mp4",
    filesize: "105MB",
    duration: 280,
    videochannel: "Maajja",
    like: 3500000,
    views: 500000000,
    uploader: "maajja"
},
{
    videotitle: "Rowdy Baby - Maari 2",
    filename: "rowdy-baby.mp4",
    filepath: "https://www.youtube.com/embed/x6Q7c9RyMzk",
    filetype: "video/mp4",
    filesize: "130MB",
    duration: 260,
    videochannel: "Wunderbar Studios",
    like: 7200000,
    views: 1500000000,
    uploader: "wunderbarstudios"
},
{
    videotitle: "Tum Tum - Enemy",
    filename: "tum-tum.mp4",
    filepath: "https://www.youtube.com/embed/tYSrY4iPX6w",
    filetype: "video/mp4",
    filesize: "115MB",
    duration: 240,
    videochannel: "Think Music India",
    like: 3200000,
    views: 400000000,
    uploader: "thinkmusicindia"
},
{
    videotitle: "Shape of You - Ed Sheeran",
    filename: "shape-of-you.mp4",
    filepath: "https://www.youtube.com/embed/JGwWNGJdvx8",
    filetype: "video/mp4",
    filesize: "120MB",
    duration: 233,
    videochannel: "Ed Sheeran",
    like: 2500000,
    views: 6200000000,
    uploader: "edsheeran",
  },

  {
    videotitle: "Baby Shark Dance",
    filename: "baby-shark.mp4",
    filepath: "https://www.youtube.com/embed/XqZsoesa55w",
    filetype: "video/mp4",
    filesize: "90MB",
    duration: 136,
    videochannel: "Pinkfong",
    like: 4100000,
    views: 15000000000,
    uploader: "pinkfong",
  },

  {
    videotitle: "MrBeast - Last To Leave Circle Wins",
    filename: "mrbeast-circle.mp4",
    filepath: "https://www.youtube.com/embed/0e3GPea1Tyg",
    filetype: "video/mp4",
    filesize: "200MB",
    duration: 1210,
    videochannel: "MrBeast",
    like: 3800000,
    views: 220000000,
    uploader: "mrbeast",
  },

  {
    videotitle: "Tom and Jerry Funny Compilation",
    filename: "tom-jerry.mp4",
    filepath: "https://www.youtube.com/embed/t0Q2otsqC4I",
    filetype: "video/mp4",
    filesize: "110MB",
    duration: 603,
    videochannel: "Cartoon Network",
    like: 870000,
    views: 98000000,
    uploader: "cartoonnetwork",
  },

  {
    videotitle: "Alan Walker - Faded",
    filename: "faded.mp4",
    filepath: "https://www.youtube.com/embed/60ItHLz5WEA",
    filetype: "video/mp4",
    filesize: "130MB",
    duration: 213,
    videochannel: "Alan Walker",
    like: 4500000,
    views: 3900000000,
    uploader: "alanwalker",
  },

  {
    videotitle: "Programming Tutorial for Beginners",
    filename: "coding-tutorial.mp4",
    filepath: "https://www.youtube.com/embed/zOjov-2OZ0E",
    filetype: "video/mp4",
    filesize: "160MB",
    duration: 3600,
    videochannel: "Programming with Mosh",
    like: 920000,
    views: 35000000,
    uploader: "programmingwithmosh",
  },

  {
    videotitle: "Stand Up Comedy Show",
    filename: "comedy-show.mp4",
    filepath: "https://www.youtube.com/embed/kX0vO4vlJuU",
    filetype: "video/mp4",
    filesize: "140MB",
    duration: 1546,
    videochannel: "Comedy Central",
    like: 730000,
    views: 28000000,
    uploader: "comedycentral",
  },
  {
    videotitle: "Cristiano Ronaldo Skills & Goals",
    filename: "ronaldo-skills.mp4",
    filepath: "https://www.youtube.com/embed/OUKGsb8CpF8",
    filetype: "video/mp4",
    filesize: "170MB",
    duration: 612,
    videochannel: "Football World",
    like: 1800000,
    views: 120000000,
    uploader: "footballworld",
  },

  {
    videotitle: "Marvel Avengers Final Battle",
    filename: "avengers.mp4",
    filepath: "https://www.youtube.com/embed/TcMBFSGVi1c",
    filetype: "video/mp4",
    filesize: "250MB",
    duration: 286,
    videochannel: "Marvel Entertainment",
    like: 5200000,
    views: 170000000,
    uploader: "marvel",
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
          filter: { filepath: item.filepath },
          update: { $set: item },
          upsert: true,
        },
      }))
    );

    const staleVideos = await video.deleteMany({
      filepath: { $nin: seedFilepaths },
      $or: [
        { filepath: /^https:\/\/(?:www\.)?youtube\.com\/embed\// },
        { filepath: /^https:\/\/youtu\.be\// },
      ],
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
