# Video Conferencing Setup Guide

This guide explains how to set up and use the video conferencing feature in Study Sprint.

## Overview

The video conferencing system uses:

- **WebRTC** for peer-to-peer video/audio communication
- **Socket.IO** for signaling (establishing connections)
- **SimplePeer** library for easier WebRTC handling
- **Free Google STUN servers** for NAT traversal

## Setup Instructions

### 1. Install Signaling Server Dependencies

Navigate to the signaling server directory and install dependencies:

```bash
cd signaling-server
npm install
```

### 2. Start the Signaling Server

```bash
npm start
```

The server will run on `http://localhost:3001` by default.

For development with auto-restart:

```bash
npm run dev
```

### 3. Start the Next.js Application

In the main project directory:

```bash
npm run dev
```

The app will run on `http://localhost:3000`.

## How It Works

### Components Created

1. **`utils/webrtc.ts`** - WebRTC configuration and utility functions
2. **`hooks/useSocketIO.ts`** - Socket.IO connection management
3. **`hooks/useWebRTC.ts`** - WebRTC peer connection management
4. **`components/video/VideoPlayer.tsx`** - Individual video stream display
5. **`components/video/ControlPanel.tsx`** - Video call controls
6. **`components/video/VideoCall.tsx`** - Main video call interface

### Signaling Server

The Node.js server (`signaling-server/server.js`) handles:

- Room management
- WebRTC offer/answer exchange
- ICE candidate exchange
- User join/leave notifications

## Using Video Conferencing

1. **Join a Room**: Navigate to `/room/[id]` page
2. **Grant Permissions**: Allow camera and microphone access when prompted
3. **Video Controls**:
   - 🎤 Toggle microphone on/off
   - 📹 Toggle camera on/off
   - 🖥️ Share screen
   - 📞 Leave call

## Technical Details

### WebRTC Configuration

Uses free Google STUN servers:

- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

### Media Constraints

- **Video**: 720p HD (1280x720), 30fps
- **Audio**: Echo cancellation, noise suppression enabled

### Screen Sharing

Currently implements basic screen sharing that replaces the camera feed. Advanced features like picture-in-picture would require additional implementation.

## Troubleshooting

### Common Issues

1. **Camera/Microphone Access Denied**
   - Ensure HTTPS is used in production
   - Check browser permissions
   - Some browsers require user interaction before accessing media

2. **Connection Issues**
   - Verify signaling server is running on port 3001
   - Check firewall/network restrictions
   - STUN servers may be blocked in some corporate networks

3. **No Video/Audio**
   - Check media device availability
   - Verify WebRTC browser support
   - Test with different browsers

### Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Partial support (some limitations)
- **Mobile browsers**: Limited support

## Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Production Deployment

For production deployment:

1. **HTTPS Required**: WebRTC requires HTTPS in production
2. **TURN Servers**: May need TURN servers for users behind restrictive NATs
3. **Scalable Signaling**: Consider clustering the Socket.IO server
4. **Media Server**: For large groups, consider using a media server like Janus or Kurento

## Cost Considerations

- **STUN Servers**: Free (Google STUN servers)
- **TURN Servers**: May require paid services for production
- **Bandwidth**: Direct peer-to-peer saves server bandwidth
- **Server**: Minimal CPU usage for signaling server

## Future Enhancements

Potential improvements:

- Picture-in-picture for screen sharing
- Recording functionality
- Chat integration during calls
- Virtual backgrounds
- Breakout rooms
- Advanced video effects
