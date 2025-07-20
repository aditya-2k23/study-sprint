"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { Message } from "@/types";
import { sendMessage, subscribeToGroupMessages } from "@/firebase/messages";
import {
  setTypingStatus,
  removeTypingStatus,
  subscribeToTypingStatus,
} from "@/firebase/typing";
import Chat from "@/app/components/Chat";
import VideoCall from "@/app/components/video/VideoCall";
import ProtectedRoute from "@/app/components/ProtectedRoute";

const RoomPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<{
    sessionId: string;
    title: string;
    description: string;
    participants: string[];
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only proceed with room setup if user is authenticated
    if (!currentUser) {
      return;
    }

    // In a real app, you would fetch session info from Firebase
    // For now, we'll simulate session data
    setSessionInfo({
      sessionId: id as string,
      title: "Study Session Room",
      description: "Live study session in progress",
      participants: [],
    });

    // Subscribe to room messages using session ID as room ID
    if (id) {
      const unsubscribeMessages = subscribeToGroupMessages(
        id as string,
        (newMessages) => {
          setMessages(newMessages);
        }
      );

      const unsubscribeTyping = subscribeToTypingStatus(
        id as string,
        currentUser.uid,
        (typingUserNames) => {
          setTypingUsers(typingUserNames);
        }
      );

      return () => {
        unsubscribeMessages();
        unsubscribeTyping();
      };
    }
  }, [currentUser, id, router]);

  useEffect(() => {
    // Cleanup typing timeout on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Also remove typing status when component unmounts
      if (id && currentUser && isTyping) {
        removeTypingStatus(id as string, currentUser.uid).catch(console.error);
      }
    };
  }, [id, currentUser, isTyping]);

  const handleLeaveRoom = () => {
    router.push("/dashboard");
  };

  const handleTypingStart = async () => {
    if (!id || !currentUser || isTyping) return;

    setIsTyping(true);
    try {
      await setTypingStatus(
        id as string,
        currentUser.uid,
        currentUser.displayName || currentUser.email || "Anonymous"
      );
    } catch (error) {
      console.error("Error setting typing status:", error);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  const handleTypingStop = async () => {
    if (!isTyping || !id || !currentUser) return;

    setIsTyping(false);
    try {
      await removeTypingStatus(id as string, currentUser.uid);
    } catch (error) {
      console.error("Error removing typing status:", error);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !currentUser || sendingMessage) return;

    // Immediately stop typing indicator locally
    setIsTyping(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Remove typing status from Firebase (don't wait for it)
    if (id && currentUser) {
      removeTypingStatus(id as string, currentUser.uid).catch(console.error);
    }

    setSendingMessage(true);
    try {
      await sendMessage({
        groupId: id as string,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email || "Anonymous",
        content: newMessage.trim(),
        isRead: false,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      handleTypingStart();
    } else if (!value.trim() && isTyping) {
      handleTypingStop();
    } else if (value.trim() && isTyping) {
      // Reset the timeout if user is still typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 3000);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Room Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                {sessionInfo?.title || "Study Session Room"}
              </h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-600 text-sm rounded-full">
                Live
              </span>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Main Room Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Video Area */}
            <div className="lg:col-span-3">
              <div className="bg-gray-900 rounded-lg aspect-video">
                <VideoCall
                  roomId={id as string}
                  userId={currentUser?.uid || ""}
                  userName={
                    currentUser?.displayName ||
                    currentUser?.email ||
                    "Anonymous"
                  }
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Participants */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Participants (1)
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {currentUser?.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">
                      {currentUser?.displayName || currentUser?.email || "You"}
                    </span>
                    <span className="ml-auto text-xs text-green-600">
                      (You)
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <Chat
                messages={messages}
                currentUserId={currentUser?.uid || ""}
                newMessage={newMessage}
                onSendMessage={handleSendMessage}
                onMessageInputChange={handleMessageInputChange}
                sendingMessage={sendingMessage}
                typingUsers={typingUsers}
                title="Session Chat"
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default RoomPage;
