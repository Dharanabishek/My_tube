"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorUp, Phone, PhoneOff, Radio, ScreenShare, Square } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
const recordingMimeTypes = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

function getRecordingMimeType() {
  return recordingMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export default function CallsPage() {
  const { user } = useUser();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const peerSetupRef = useRef<Promise<RTCPeerConnection> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mixedAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenAudioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingCleanupRef = useRef<(() => void) | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [roomId, setRoomId] = useState("friend-room");
  const [status, setStatus] = useState("Idle");
  const [lastSignalAt, setLastSignalAt] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const sendSignal = async (type: string, payload: any) => {
    if (!user?._id || !roomId.trim()) return;
    await axiosInstance.post(`/collaboration/${roomId}/signals`, {
      type,
      payload,
    });
  };

  const ensurePeer = async () => {
    if (peerRef.current && peerRef.current.signalingState !== "closed") {
      return peerRef.current;
    }

    if (peerSetupRef.current) return peerSetupRef.current;

    peerSetupRef.current = (async () => {
      const peer = new RTCPeerConnection({ iceServers });
      peerRef.current = peer;
      remoteStreamRef.current = new MediaStream();

      try {
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

        const existingStream = localStreamRef.current;
        const hasLiveTracks = existingStream
          ?.getTracks()
          .some((track) => track.readyState === "live");
        const stream =
          hasLiveTracks && existingStream
            ? existingStream
            : await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        stream.getTracks().forEach((track) => {
          const senderExists = peer
            .getSenders()
            .some((sender) => sender.track === track || sender.track?.kind === track.kind);

          if (!senderExists) {
            peer.addTrack(track, stream);
          }
        });

        return peer;
      } catch (error) {
        peer.close();
        if (peerRef.current === peer) peerRef.current = null;
        remoteStreamRef.current = null;
        throw error;
      }
    })();

    try {
      return await peerSetupRef.current;
    } finally {
      peerSetupRef.current = null;
    }
  };

  const startCall = async () => {
    if (!user) {
      setStatus("Please sign in to start a call.");
      return;
    }
    try {
      const peer = await ensurePeer();
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await sendSignal("offer", offer);
      setStatus("Calling. Share the room name with a friend.");
    } catch (error) {
      console.error(error);
      setStatus("Could not start call. Check camera and microphone permissions.");
    }
  };

  const shareScreen = async () => {
    const peer = await ensurePeer();
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
    screenStreamRef.current = screenStream;
    const screenTrack = screenStream.getVideoTracks()[0];
    const videoSender = peer.getSenders().find((item) => item.track?.kind === "video");
    const audioSender = peer.getSenders().find((item) => item.track?.kind === "audio");
    if (videoSender && screenTrack) {
      await videoSender.replaceTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

      const screenAudioTrack = screenStream.getAudioTracks()[0];
      const micTrack = localStreamRef.current?.getAudioTracks()[0];

      if (audioSender && screenAudioTrack) {
        const AudioContextCtor =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextCtor();
        const destination = audioContext.createMediaStreamDestination();

        if (micTrack) {
          audioContext
            .createMediaStreamSource(new MediaStream([micTrack]))
            .connect(destination);
        }

        audioContext
          .createMediaStreamSource(new MediaStream([screenAudioTrack]))
          .connect(destination);

        const mixedAudioTrack = destination.stream.getAudioTracks()[0];
        await audioSender.replaceTrack(mixedAudioTrack);
        screenAudioContextRef.current = audioContext;
        mixedAudioTrackRef.current = mixedAudioTrack;
      }

      setStatus("Screen sharing. Pick a YouTube tab/window from the browser prompt.");
      screenTrack.onended = async () => {
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        const micTrack = localStreamRef.current?.getAudioTracks()[0];
        if (videoSender && cameraTrack) await videoSender.replaceTrack(cameraTrack);
        if (audioSender && micTrack && mixedAudioTrackRef.current) {
          await audioSender.replaceTrack(micTrack);
        }
        mixedAudioTrackRef.current?.stop();
        mixedAudioTrackRef.current = null;
        await screenAudioContextRef.current?.close();
        screenAudioContextRef.current = null;
        screenStream.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      };
    }
  };

  const startRecording = () => {
    const hasLocalVideo = Boolean(localVideoRef.current?.srcObject);
    const hasRemoteVideo = Boolean(remoteVideoRef.current?.srcObject);

    if (!hasLocalVideo && !hasRemoteVideo) {
      setStatus("Start a call before recording.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext("2d");
    if (!context) {
      setStatus("Recording is not supported in this browser.");
      return;
    }

    let animationFrame = 0;
    const drawFrame = () => {
      context.fillStyle = "#050505";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const localVideo = localVideoRef.current;
      const remoteVideo = remoteVideoRef.current;
      const drawLocal = localVideo && localVideo.readyState >= 2;
      const drawRemote = remoteVideo && remoteVideo.readyState >= 2;

      if (drawRemote) {
        context.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
      }

      if (drawLocal) {
        const insetWidth = 320;
        const insetHeight = 180;
        context.drawImage(
          localVideo,
          canvas.width - insetWidth - 24,
          canvas.height - insetHeight - 24,
          insetWidth,
          insetHeight
        );
      }

      if (!drawRemote && drawLocal && localVideo) {
        context.drawImage(localVideo, 0, 0, canvas.width, canvas.height);
      }

      animationFrame = window.requestAnimationFrame(drawFrame);
    };
    drawFrame();

    const recordingStream = canvas.captureStream(30);
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    const audioTracks = [
      ...(localStreamRef.current?.getAudioTracks() || []),
      ...(screenStreamRef.current?.getAudioTracks() || []),
      ...(remoteStreamRef.current?.getAudioTracks() || []),
    ];

    audioTracks.forEach((track) => {
      audioContext
        .createMediaStreamSource(new MediaStream([track]))
        .connect(destination);
    });

    destination.stream.getAudioTracks().forEach((track) => {
      recordingStream.addTrack(track);
    });

    recordedChunksRef.current = [];
    const mimeType = getRecordingMimeType();
    const recorder = new MediaRecorder(
      recordingStream,
      mimeType ? { mimeType } : undefined
    );
    recorderRef.current = recorder;
    recordingCleanupRef.current = () => {
      window.cancelAnimationFrame(animationFrame);
      recordingStream.getTracks().forEach((track) => track.stop());
      void audioContext.close();
    };
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      recordingCleanupRef.current?.();
      recordingCleanupRef.current = null;
      const blob = new Blob(recordedChunksRef.current, {
        type: mimeType || "video/webm",
      });
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
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const hangup = async () => {
    await sendSignal("hangup", { at: Date.now() }).catch(console.error);
    peerRef.current?.close();
    peerRef.current = null;
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    mixedAudioTrackRef.current?.stop();
    mixedAudioTrackRef.current = null;
    await screenAudioContextRef.current?.close();
    screenAudioContextRef.current = null;
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
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
        const query = new URLSearchParams();
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
