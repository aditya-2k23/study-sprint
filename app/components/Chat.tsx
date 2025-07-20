"use client";

import { useRef, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { Message } from "@/types";

interface ChatProps {
  messages: Message[];
  currentUserId: string;
  newMessage: string;
  onSendMessage: (e: React.FormEvent) => void;
  onMessageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sendingMessage: boolean;
  typingUsers: string[];
  title?: string;
}

const Chat = ({
  messages,
  currentUserId,
  newMessage,
  onSendMessage,
  onMessageInputChange,
  sendingMessage,
  typingUsers,
  title = "Group Chat",
}: ChatProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (timestamp: Date | Timestamp | string) => {
    try {
      let messageDate: Date;

      // Handle Firestore Timestamp objects
      if (timestamp && typeof (timestamp as Timestamp).toDate === "function") {
        messageDate = (timestamp as Timestamp).toDate();
      } else if (timestamp instanceof Date) {
        messageDate = timestamp;
      } else if (typeof timestamp === "string") {
        messageDate = new Date(timestamp);
      } else {
        return "Now";
      }

      const now = new Date();
      const diffInHours =
        (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return messageDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        return messageDate.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      console.error("Error formatting message time:", error);
      return "Now";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="border border-gray-200 rounded-lg h-64 mb-4 p-4 overflow-y-auto bg-gray-50">
        {messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.messageId}
                className={`flex ${
                  message.senderId === currentUserId
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === currentUserId
                      ? "bg-blue-400 text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {message.senderId !== currentUserId && (
                    <p className="text-xs text-gray-500 mb-1">
                      {message.senderName}
                    </p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === currentUserId
                        ? "text-blue-100"
                        : "text-gray-400"
                    }`}
                  >
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5-1.484L3 21l2.516-4C4.573 15.673 3 13.963 3 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
              />
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start mt-2">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 border border-gray-300">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing`
                    : typingUsers.length === 2
                    ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
                    : `${typingUsers[0]} and ${
                        typingUsers.length - 1
                      } others are typing`}
                </span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={onSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={onMessageInputChange}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={sendingMessage}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sendingMessage}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white px-6 py-2 rounded-lg font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingMessage ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default Chat;
