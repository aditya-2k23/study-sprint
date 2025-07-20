"use client";

import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  userName: string;
  isLocal?: boolean;
  isMuted?: boolean;
  className?: string;
}

const VideoPlayer = ({
  stream,
  userName,
  isLocal = false,
  isMuted = false,
  className = "",
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo =
    stream?.getVideoTracks().some((track) => track.enabled) ?? false;

  return (
    <div
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted || isLocal} // Always mute local video to prevent feedback
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mb-2 mx-auto">
              {userName.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm text-gray-300">{userName}</p>
            <p className="text-xs text-gray-400 mt-1">Camera off</p>
          </div>
        </div>
      )}

      {/* User name overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        {userName} {isLocal && "(You)"}
      </div>

      {/* Audio indicator */}
      {!isMuted && stream?.getAudioTracks().some((track) => track.enabled) && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default VideoPlayer;
