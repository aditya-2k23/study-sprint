// WebRTC configuration with free STUN servers
export const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

// Media constraints for video calls
export const MEDIA_CONSTRAINTS = {
  video: {
    width: { min: 320, ideal: 640, max: 1280 },
    height: { min: 240, ideal: 480, max: 720 },
    frameRate: { min: 15, ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

// Screen sharing constraints
export const SCREEN_CONSTRAINTS = {
  video: {
    cursor: "always" as const,
    displaySurface: "monitor" as const,
  },
  audio: true,
};

// Peer connection configuration
export const PEER_CONFIG = {
  ...ICE_SERVERS,
};

// Helper function to get user media
export const getUserMedia = async (
  constraints = MEDIA_CONSTRAINTS
): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error("Error accessing media devices:", error);
    throw error;
  }
};

// Helper function to get screen share
export const getScreenShare = async (): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(
      SCREEN_CONSTRAINTS
    );
    return stream;
  } catch (error) {
    console.error("Error accessing screen share:", error);
    throw error;
  }
};

// Helper function to stop all tracks in a stream
export const stopMediaStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
};

// Helper function to check if browser supports WebRTC
export const isWebRTCSupported = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    "getUserMedia" in navigator.mediaDevices &&
    window.RTCPeerConnection
  );
};
