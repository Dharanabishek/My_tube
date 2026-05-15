import mongoose from "mongoose";
import dotenv from "dotenv";
import video from "./Modals/video.js";

dotenv.config();

const seedVideos = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB");

    // Clear existing videos
    await video.deleteMany({});
    console.log("Cleared existing videos");

    // Add test videos
    const testVideos = [
      {
        videotitle: "Amazing Nature Documentary",
        filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
        filepath: "/uploads/2025-06-25T06-09-29.296Z-vdo.mp4",
        filetype: "video/mp4",
        filesize: "5MB",
        videochannel: "Nature Channel",
        like: 1250,
        views: 45000,
        uploader: "nature_lover",
      },
      {
        videotitle: "Cooking Tutorial: Perfect Pasta",
        filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
        filepath: "/uploads/2025-06-25T06-09-29.296Z-vdo.mp4",
        filetype: "video/mp4",
        filesize: "5MB",
        videochannel: "Chef's Kitchen",
        like: 890,
        views: 23000,
        uploader: "chef_master",
      },
      {
        videotitle: "Web Development Tips and Tricks",
        filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
        filepath: "/uploads/2025-06-25T06-09-29.296Z-vdo.mp4",
        filetype: "video/mp4",
        filesize: "5MB",
        videochannel: "Code Masters",
        like: 2100,
        views: 67000,
        uploader: "dev_guru",
      },
      {
        videotitle: "Travel Vlog: Paris Adventure",
        filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
        filepath: "/uploads/2025-06-25T06-09-29.296Z-vdo.mp4",
        filetype: "video/mp4",
        filesize: "5MB",
        videochannel: "World Travelers",
        like: 3500,
        views: 120000,
        uploader: "travel_vlogger",
      },
      {
        videotitle: "Fitness Workout Routine",
        filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
        filepath: "/uploads/2025-06-25T06-09-29.296Z-vdo.mp4",
        filetype: "video/mp4",
        filesize: "5MB",
        videochannel: "Fitness Hub",
        like: 1800,
        views: 55000,
        uploader: "fitness_coach",
      },
      {
        videotitle: "Music Production Basics",
        filename: "2025-06-25T06-09-29.296Z-vdo.mp4",
        filepath: "/uploads/2025-06-25T06-09-29.296Z-vdo.mp4",
        filetype: "video/mp4",
        filesize: "5MB",
        videochannel: "Beat Makers",
        like: 950,
        views: 32000,
        uploader: "music_producer",
      },
    ];

    await video.insertMany(testVideos);
    console.log("✅ Successfully added 6 test videos to MongoDB");
    
    const count = await video.countDocuments();
    console.log(`Total videos in database: ${count}`);

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedVideos();
