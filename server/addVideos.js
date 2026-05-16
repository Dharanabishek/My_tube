import mongoose from "mongoose";
import dotenv from "dotenv";
import video from "./Modals/video.js";

dotenv.config();

// Replace this array with YOUR YouTube videos
const YOUR_VIDEOS = [
  
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
    videotitle: "Nature Relaxation 4K",
    filename: "nature-video.mp4",
    filepath: "https://www.youtube.com/embed/6LTYq-qMags",
    filetype: "video/mp4",
    filesize: "210MB",
    duration: 3600,
    videochannel: "Nature Relaxation",
    like: 450000,
    views: 18000000,
    uploader: "naturerelaxation",
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
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Connected to MongoDB");

    // Option 1: Add videos without clearing existing ones
    await video.insertMany(YOUR_VIDEOS);
    console.log(`✅ Successfully added ${YOUR_VIDEOS.length} videos to database`);

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
