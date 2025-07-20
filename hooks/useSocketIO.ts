"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketIOProps {
  roomId: string;
  userId: string;
  userName: string;
}

export const useSocketIO = ({ roomId, userId, userName }: UseSocketIOProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<
    Array<{ userId: string; userName: string }>
  >([]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      {
        transports: ["websocket"],
        autoConnect: true,
      }
    );

    socketInstance.on("connect", () => {
      console.log("Connected to signaling server");
      setIsConnected(true);

      // Join the room
      socketInstance.emit("join-room", { roomId, userId, userName });
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from signaling server");
      setIsConnected(false);
    });

    // Handle room participants update
    socketInstance.on(
      "room-participants",
      (data: { participants: Array<{ userId: string; userName: string }> }) => {
        setParticipants(data.participants);
      }
    );

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [roomId, userId, userName]);

  return {
    socket,
    isConnected,
    participants,
  };
};
