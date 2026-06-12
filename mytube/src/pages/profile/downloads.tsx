"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import VideoThumbnail from "@/components/VideoThumbnail";
import { Download, ExternalLink } from "lucide-react";

const isExternalVideo = (filepath?: string) => /^https?:\/\//i.test(filepath || "");

const readDownloadError = async (error: any) => {
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  return data || {};
};

export default function DownloadsPage() {
  const { user } = useUser();
  const [downloads, setDownloads] = useState([] as any[]);
  const [loading, setLoading] = useState(false);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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

  const handleDownloadAgain = async (item: any) => {
    const video = item.videoId;
    if (!user || !video?._id) return;

    try {
      setMessage("");
      setActiveDownloadId(item._id);
      const response = await axiosInstance.get(`/download/file/${video._id}`, {
        params: { userId: user._id },
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = video.filename || `${video.videotitle || "video"}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      setMessage("Download started.");
    } catch (error: any) {
      const payload = await readDownloadError(error);
      setMessage(payload?.message || "Could not download this video again.");
    } finally {
      setActiveDownloadId(null);
    }
  };

  if (!user) return <div className="p-4">Please login to view your downloads.</div>;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold">Downloads</h2>
        <p className="text-sm text-muted-foreground">
          Videos you download from the watch page are saved here.
        </p>
      </div>
      {message && <div className="text-sm text-muted-foreground">{message}</div>}
      {loading && <div>Loading...</div>}
      {!loading && downloads.length === 0 && <div>No downloads yet.</div>}
      <ul className="space-y-3">
        {downloads.map((d) => (
          <li key={d._id} className="p-3 border rounded">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded bg-muted">
                  <VideoThumbnail
                    video={d.videoId}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
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
              {isExternalVideo(d.videoId?.filepath) ? (
                <Button variant="outline" size="sm" disabled>
                  <ExternalLink className="h-4 w-4" />
                  External video
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleDownloadAgain(d)}
                  disabled={activeDownloadId === d._id}
                >
                  <Download className="h-4 w-4" />
                  {activeDownloadId === d._id ? "Downloading..." : "Download again"}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
