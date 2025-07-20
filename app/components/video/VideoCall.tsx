"use client";

import { useEffect, useRef } from "react";
import VideoPlayer from "./VideoPlayer";
import ControlPanel from "./ControlPanel";
import { useWebRTC } from "@/hooks/useWebRTC";

interface VideoCallProps {
  roomId: string;
  userId: string;
  userName: string;
}

const VideoCall = ({ roomId, userId, userName }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const {
    peers,
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    cleanup,
  } = useWebRTC(roomId, userId);

  // Initialize camera on component mount
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (error) {
        console.error("Failed to initialize camera:", error);
      }
    };

    initializeCamera();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [cleanup, localStream]);

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        await startScreenShare();
      } catch (error) {
        console.error("Failed to start screen sharing:", error);
      }
    }
  };

  const handleLeaveCall = () => {
    cleanup();
    // Navigate away or close video call
    // This would typically be handled by the parent component
  };

  const remoteStreams = Array.from(peers.values())
    .map((peer) => ({ stream: peer.stream || null, userName: peer.userName }))
    .filter((item) => item.stream !== null);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div
          className={`grid gap-4 h-full ${
            remoteStreams.length === 0
              ? "grid-cols-1"
              : remoteStreams.length === 1
              ? "grid-cols-2"
              : remoteStreams.length <= 4
              ? "grid-cols-2 grid-rows-2"
              : "grid-cols-3 grid-rows-2"
          }`}
        >
          {/* Local Video */}
          <div className="relative">
            <VideoPlayer
              stream={localStream}
              isLocal={true}
              userName={userName}
              className="w-full h-full"
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              You {isScreenSharing && "(Sharing)"}
            </div>
          </div>

          {/* Remote Videos */}
          {remoteStreams.map((item, index) => (
            <div key={`remote-${index}`} className="relative">
              <VideoPlayer
                stream={item.stream}
                isLocal={false}
                userName={item.userName}
                className="w-full h-full"
              />
            </div>
          ))}

          {/* Empty slots for better grid layout */}
          {remoteStreams.length > 0 &&
            remoteStreams.length < 5 &&
            Array.from({ length: 4 - remoteStreams.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-gray-800 rounded-lg flex items-center justify-center"
              >
                <div className="text-gray-500 text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <p className="text-sm">Waiting for participant...</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-800 border-t border-gray-700">
        <ControlPanel
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isScreenSharing={isScreenSharing}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onToggleScreenShare={handleToggleScreenShare}
          onLeaveCall={handleLeaveCall}
        />
      </div>
    </div>
  );
};

export default VideoCall;
