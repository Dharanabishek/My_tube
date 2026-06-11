import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";

const Videogrid = () => {
  const [videos, setvideo] = useState<any>(null);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setvideo(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {loading ? (
        <>Loading...</>
      ) : Array.isArray(videos) && videos.length > 0 ? (
        videos.map((video: any) => (
          <Videocard
            key={video._id}
            video={video}
          />
        ))
      ) : (
        <p>No videos found</p>
      )}
    </div>
  );
};

export default Videogrid;
