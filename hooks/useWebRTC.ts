"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import SimplePeer from "simple-peer";
import {
  getUserMedia,
  getScreenShare,
  stopMediaStream,
  PEER_CONFIG,
} from "@/utils/webrtc";
import { useSocketIO } from "./useSocketIO";

interface Peer {
  userId: string;
  userName: string;
  peer: SimplePeer.Instance;
  stream?: MediaStream;
}

export const useWebRTC = (roomId: string, userId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peersRef = useRef<Map<string, Peer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Use socket connection
  const { socket } = useSocketIO({ roomId, userId, userName: userId });

  // Initialize local media stream
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await getUserMedia();
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("Error getting user media:", error);
      throw error;
    }
  }, []);

  // Create peer connection
  const createPeer = useCallback(
    (remoteUserId: string, remoteUserName: string, initiator: boolean) => {
      const peer = new SimplePeer({
        initiator,
        trickle: false,
        config: PEER_CONFIG,
        stream: localStreamRef.current || undefined,
      });

      peer.on("signal", (signal: SimplePeer.SignalData) => {
        if (socket) {
          if (signal.type === "offer") {
            socket.emit("offer", {
              offer: signal,
              toUserId: remoteUserId,
              fromUserId: userId,
            });
          } else if (signal.type === "answer") {
            socket.emit("answer", {
              answer: signal,
              toUserId: remoteUserId,
              fromUserId: userId,
            });
          }
        }
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        console.log("Received remote stream from:", remoteUserName);
        setPeers((prev) => {
          const newPeers = new Map(prev);
          const existingPeer = newPeers.get(remoteUserId);
          if (existingPeer) {
            existingPeer.stream = remoteStream;
            newPeers.set(remoteUserId, existingPeer);
          }
          return newPeers;
        });
      });

      peer.on("error", (error: Error) => {
        console.error("Peer error:", error);
      });

      peer.on("close", () => {
        console.log("Peer connection closed:", remoteUserName);
        setPeers((prev) => {
          const newPeers = new Map(prev);
          newPeers.delete(remoteUserId);
          return newPeers;
        });
        peersRef.current.delete(remoteUserId);
      });

      const peerData: Peer = {
        userId: remoteUserId,
        userName: remoteUserName,
        peer,
      };

      setPeers((prev) => new Map(prev.set(remoteUserId, peerData)));
      peersRef.current.set(remoteUserId, peerData);

      return peer;
    },
    [socket, userId]
  );

  // Add peer function
  const addPeer = useCallback(
    (remoteUserId: string, remoteUserName: string) => {
      createPeer(remoteUserId, remoteUserName, true);
    },
    [createPeer]
  );

  // Remove peer function
  const removePeer = useCallback((remoteUserId: string) => {
    const peer = peersRef.current.get(remoteUserId);
    if (peer) {
      peer.peer.destroy();
      peersRef.current.delete(remoteUserId);
      setPeers((prev) => {
        const newPeers = new Map(prev);
        newPeers.delete(remoteUserId);
        return newPeers;
      });
    }
  }, []);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    // Handle user joined
    socket.on(
      "user-joined",
      ({
        userId: remoteUserId,
        userName: remoteUserName,
      }: {
        userId: string;
        userName: string;
      }) => {
        if (remoteUserId !== userId) {
          console.log("User joined:", remoteUserName);
          createPeer(remoteUserId, remoteUserName, true);
        }
      }
    );

    // Handle user left
    socket.on("user-left", ({ userId: remoteUserId }: { userId: string }) => {
      console.log("User left:", remoteUserId);
      removePeer(remoteUserId);
    });

    // Handle offer
    socket.on(
      "offer",
      ({
        offer,
        fromUserId,
        fromUserName,
      }: {
        offer: SimplePeer.SignalData;
        fromUserId: string;
        fromUserName: string;
      }) => {
        console.log("Received offer from:", fromUserName);
        const peer = createPeer(fromUserId, fromUserName, false);
        peer.signal(offer);
      }
    );

    // Handle answer
    socket.on(
      "answer",
      ({
        answer,
        fromUserId,
      }: {
        answer: SimplePeer.SignalData;
        fromUserId: string;
      }) => {
        console.log("Received answer from:", fromUserId);
        const peerData = peersRef.current.get(fromUserId);
        if (peerData) {
          peerData.peer.signal(answer);
        }
      }
    );

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("offer");
      socket.off("answer");
    };
  }, [socket, userId, createPeer, removePeer]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await getScreenShare();

      // For now, just update the local stream to screen share
      setLocalStream(screenStream);
      localStreamRef.current = screenStream;
      setIsScreenSharing(true);
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }, []);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    try {
      const cameraStream = await getUserMedia();

      // Switch back to camera
      setLocalStream(cameraStream);
      localStreamRef.current = cameraStream;
      setIsScreenSharing(false);
    } catch (error) {
      console.error("Error stopping screen share:", error);
      throw error;
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop local stream
    stopMediaStream(localStreamRef.current);

    // Destroy all peer connections
    peersRef.current.forEach(({ peer }) => {
      peer.destroy();
    });
    peersRef.current.clear();
    setPeers(new Map());
    setLocalStream(null);
    localStreamRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    localStream,
    peers,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    initializeMedia,
    addPeer,
    removePeer,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
};
