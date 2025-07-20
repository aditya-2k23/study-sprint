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
    if (!currentUser) {
      router.push("/login");
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

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
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
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4">
              <div className="text-center text-white">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-lg font-medium">Video Conference</p>
                <p className="text-gray-400">
                  Camera and screen sharing would be implemented here
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors cursor-pointer">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
              <button className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors cursor-pointer">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors cursor-pointer">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>
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
                  <span className="ml-auto text-xs text-green-600">(You)</span>
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
  );
};

export default RoomPage;
