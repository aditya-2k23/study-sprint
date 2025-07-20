import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new SocketIO(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://your-app-domain.vercel.app", // Add your production domain
      "https://*.vercel.app" // Allow all Vercel preview deployments
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Use CORS middleware for Express
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-app-domain.vercel.app", // Add your production domain
    "https://*.vercel.app" // Allow all Vercel preview deployments
  ],
  credentials: true
}));

app.use(express.json());

// Store room information
const rooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle joining a room
  socket.on('join-room', ({ roomId, userId, userName }) => {
    console.log(`User ${userName} (${userId}) joining room ${roomId}`);

    // Leave any existing rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join the new room
    socket.join(roomId);

    // Store user info
    socket.userId = userId;
    socket.userName = userName;
    socket.roomId = roomId;

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const room = rooms.get(roomId);
    room.set(userId, { userId, userName, socketId: socket.id });

    // Notify other users in the room
    socket.to(roomId).emit('user-joined', { userId, userName });

    // Send current participants to the new user
    const participants = Array.from(room.values()).filter(p => p.userId !== userId);
    participants.forEach(participant => {
      socket.emit('user-joined', {
        userId: participant.userId,
        userName: participant.userName
      });
    });

    console.log(`Room ${roomId} now has ${room.size} participants`);
  });

  // Handle WebRTC offer
  socket.on('offer', ({ offer, toUserId, fromUserId }) => {
    console.log(`Offer from ${fromUserId} to ${toUserId}`);

    const room = rooms.get(socket.roomId);
    if (room) {
      const targetUser = room.get(toUserId);
      if (targetUser) {
        io.to(targetUser.socketId).emit('offer', {
          offer,
          fromUserId,
          fromUserName: socket.userName
        });
      }
    }
  });

  // Handle WebRTC answer
  socket.on('answer', ({ answer, toUserId, fromUserId }) => {
    console.log(`Answer from ${fromUserId} to ${toUserId}`);

    const room = rooms.get(socket.roomId);
    if (room) {
      const targetUser = room.get(toUserId);
      if (targetUser) {
        io.to(targetUser.socketId).emit('answer', {
          answer,
          fromUserId,
          fromUserName: socket.userName
        });
      }
    }
  });

  // Handle ICE candidates
  socket.on('ice-candidate', ({ candidate, toUserId, fromUserId }) => {
    console.log(`ICE candidate from ${fromUserId} to ${toUserId}`);

    const room = rooms.get(socket.roomId);
    if (room) {
      const targetUser = room.get(toUserId);
      if (targetUser) {
        io.to(targetUser.socketId).emit('ice-candidate', {
          candidate,
          fromUserId
        });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (socket.roomId && socket.userId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.delete(socket.userId);

        // Notify other users in the room
        socket.to(socket.roomId).emit('user-left', {
          userId: socket.userId
        });

        console.log(`User ${socket.userName} left room ${socket.roomId}`);

        // Clean up empty rooms
        if (room.size === 0) {
          rooms.delete(socket.roomId);
          console.log(`Room ${socket.roomId} deleted (empty)`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
