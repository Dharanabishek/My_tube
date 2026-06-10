"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorUp, Phone, PhoneOff, Radio, ScreenShare, Square } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

export default function CallsPage() {
  const { user } = useUser();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [roomId, setRoomId] = useState("friend-room");
  const [status, setStatus] = useState("Idle");
  const [lastSignalAt, setLastSignalAt] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const sendSignal = async (type: string, payload: any) => {
    if (!user?._id || !roomId.trim()) return;
    await axiosInstance.post(`/collaboration/${roomId}/signals`, {
      senderId: user._id,
      type,
      payload,
    });
  };

  const ensurePeer = async () => {
    if (peerRef.current) return peerRef.current;

    const peer = new RTCPeerConnection({ iceServers });
    peerRef.current = peer;
    remoteStreamRef.current = new MediaStream();

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", event.candidate.toJSON()).catch(console.error);
      }
    };

    peer.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStreamRef.current?.addTrack(track);
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    return peer;
  };

  const startCall = async () => {
    if (!user) {
      setStatus("Please sign in to start a call.");
      return;
    }
    const peer = await ensurePeer();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await sendSignal("offer", offer);
    setStatus("Calling. Share the room name with a friend.");
  };

  const shareScreen = async () => {
    const peer = await ensurePeer();
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = peer.getSenders().find((item) => item.track?.kind === "video");
    if (sender && screenTrack) {
      await sender.replaceTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      setStatus("Screen sharing. Pick a YouTube tab/window from the browser prompt.");
      screenTrack.onended = async () => {
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      };
    }
  };

  const startRecording = () => {
    const tracks = [
      ...(localStreamRef.current?.getTracks() || []),
      ...(remoteStreamRef.current?.getTracks() || []),
    ];
    if (tracks.length === 0) {
      setStatus("Start a call before recording.");
      return;
    }

    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(new MediaStream(tracks));
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `my-tube-call-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setRecording(false);
      setStatus("Recording saved locally.");
    };
    recorder.start();
    setRecording(true);
    setStatus("Recording call locally.");
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const hangup = async () => {
    await sendSignal("hangup", { at: Date.now() }).catch(console.error);
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setStatus("Call ended.");
  };

  const handleSignal = async (signal: any) => {
    const peer = await ensurePeer();

    if (signal.type === "offer") {
      await peer.setRemoteDescription(signal.payload);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await sendSignal("answer", answer);
      setStatus("Connected. Answer sent.");
    }

    if (signal.type === "answer" && !peer.currentRemoteDescription) {
      await peer.setRemoteDescription(signal.payload);
      setStatus("Connected.");
    }

    if (signal.type === "ice-candidate") {
      await peer.addIceCandidate(signal.payload).catch(() => undefined);
    }

    if (signal.type === "hangup") {
      peer.close();
      peerRef.current = null;
      setStatus("Friend ended the call.");
    }
  };

  useEffect(() => {
    if (!user?._id || !roomId.trim()) return;
    const interval = window.setInterval(async () => {
      try {
        const query = new URLSearchParams({ userId: user._id });
        if (lastSignalAt) query.set("since", lastSignalAt);
        const res = await axiosInstance.get(
          `/collaboration/${roomId}/signals?${query.toString()}`
        );
        for (const signal of res.data || []) {
          await handleSignal(signal);
          setLastSignalAt(signal.createdAt);
        }
      } catch (error) {
        console.error(error);
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [user?._id, roomId, lastSignalAt]);

  if (!user) return <div className="p-4">Please sign in to use video calls.</div>;

  return (
    <main className="w-full p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={roomId}
          onChange={(event) => {
            setRoomId(event.target.value);
            setLastSignalAt(null);
          }}
          className="max-w-xs"
          placeholder="Friend room name"
        />
        <Button onClick={startCall}>
          <Phone className="h-4 w-4 mr-2" />
          Start
        </Button>
        <Button variant="secondary" onClick={shareScreen}>
          <ScreenShare className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="secondary" onClick={recording ? stopRecording : startRecording}>
          {recording ? <Square className="h-4 w-4 mr-2" /> : <Radio className="h-4 w-4 mr-2" />}
          {recording ? "Stop" : "Record"}
        </Button>
        <Button variant="destructive" onClick={hangup}>
          <PhoneOff className="h-4 w-4 mr-2" />
          End
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MonitorUp className="h-4 w-4" />
            You
          </div>
          <video ref={localVideoRef} autoPlay muted playsInline className="aspect-video w-full bg-black rounded-md" />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Friend</div>
          <video ref={remoteVideoRef} autoPlay playsInline className="aspect-video w-full bg-black rounded-md" />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">{status}</div>
    </main>
  );
}
