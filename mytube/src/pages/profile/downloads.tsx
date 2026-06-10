"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

export default function DownloadsPage() {
  const { user } = useUser();
  const [downloads, setDownloads] = useState([] as any[]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchDownloads = async () => {
      setLoading(true);
      try {
        const resp = await axiosInstance.get(`/download/user/${user._id}`);
        setDownloads(resp.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDownloads();
  }, [user]);

  if (!user) return <div className="p-4">Please login to view your downloads.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Downloads</h2>
      {loading && <div>Loading...</div>}
      {!loading && downloads.length === 0 && <div>No downloads yet.</div>}
      <ul className="space-y-3">
        {downloads.map((d) => (
          <li key={d._id} className="p-3 border rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {d.videoId?.videotitle || "Downloaded video"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {d.videoId?.videochannel || "Unknown channel"}
                </div>
                <div className="text-sm text-muted">Downloaded: {new Date(d.downloadDate).toLocaleString()}</div>
                <div className="text-sm">Plan: {d.planType}</div>
                <div className="text-sm">Count: {d.downloadCount}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
