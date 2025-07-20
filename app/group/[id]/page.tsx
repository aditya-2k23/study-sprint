"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { StudyGroup, Message } from "@/types";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { formatDate } from "@/utils";
import { sendMessage, subscribeToGroupMessages } from "@/firebase/messages";
import {
  setTypingStatus,
  removeTypingStatus,
  subscribeToTypingStatus,
} from "@/firebase/typing";
import {
  createSession,
  subscribeToGroupSessions,
  StudySession,
} from "@/firebase/sessions";

const GroupPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: 60, // in minutes
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id || !currentUser) return;
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser]);

  useEffect(() => {
    if (!group || !currentUser) return;

    // Subscribe to messages
    const unsubscribeMessages = subscribeToGroupMessages(
      group.groupId,
      (newMessages) => {
        setMessages(newMessages);
      }
    );

    // Subscribe to typing status
    const unsubscribeTyping = subscribeToTypingStatus(
      group.groupId,
      currentUser.uid,
      (typingUserNames) => {
        setTypingUsers(typingUserNames);
      }
    );

    // Subscribe to sessions
    const unsubscribeSessions = subscribeToGroupSessions(
      group.groupId,
      (groupSessions) => {
        setSessions(groupSessions);
      }
    );

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
      unsubscribeSessions();
    };
  }, [group, currentUser]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Cleanup typing timeout on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Also remove typing status when component unmounts
      if (group && currentUser && isTyping) {
        removeTypingStatus(group.groupId, currentUser.uid).catch(console.error);
      }
    };
  }, [group, currentUser, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTypingStart = async () => {
    if (!group || !currentUser || isTyping) return;

    setIsTyping(true);
    try {
      await setTypingStatus(
        group.groupId,
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
    if (!isTyping || !group || !currentUser) return;

    setIsTyping(false);
    try {
      await removeTypingStatus(group.groupId, currentUser.uid);
    } catch (error) {
      console.error("Error removing typing status:", error);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !currentUser) return;

    try {
      const scheduledDateTime = new Date(
        `${sessionForm.date}T${sessionForm.time}`
      );

      if (scheduledDateTime < new Date()) {
        alert("Please select a future date and time");
        return;
      }

      // Save session to Firebase
      await createSession(group.groupId, {
        title: sessionForm.title,
        description: sessionForm.description,
        scheduledTime: scheduledDateTime,
        duration: sessionForm.duration,
        createdBy: currentUser.uid,
      });

      // Reset form and close modal
      setSessionForm({
        title: "",
        description: "",
        date: "",
        time: "",
        duration: 60,
      });
      setShowScheduleModal(false);
    } catch (error) {
      console.error("Error scheduling session:", error);
      alert("Failed to schedule session. Please try again.");
    }
  };

  const handleJoinSession = (sessionId: string) => {
    router.push(`/room/${sessionId}`);
  };

  const isSessionActive = (session: StudySession) => {
    const now = new Date();
    const sessionStart = session.scheduledTime.toDate();
    const sessionEnd = new Date(
      sessionStart.getTime() + session.duration * 60000
    );

    return now >= sessionStart && now <= sessionEnd;
  };

  const isSessionUpcoming = (session: StudySession) => {
    const now = new Date();
    const sessionStart = session.scheduledTime.toDate();
    const timeDiff = sessionStart.getTime() - now.getTime();

    // Session is upcoming if it starts within 15 minutes
    return timeDiff > 0 && timeDiff <= 15 * 60 * 1000;
  };

  const formatSessionTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const loadGroup = async () => {
    try {
      setLoading(true);
      const groupDoc = await getDoc(doc(db, "studyGroups", id as string));

      if (!groupDoc.exists()) {
        setError("Group not found");
        return;
      }

      const groupData = {
        groupId: groupDoc.id,
        ...groupDoc.data(),
      } as StudyGroup;

      // Check if user is a member
      if (!groupData.members.includes(currentUser?.uid ?? "")) {
        setError("You are not a member of this group");
        return;
      }

      setGroup(groupData);
    } catch (error) {
      console.error("Error loading group:", error);
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !currentUser) return;

    const confirmed = window.confirm(
      "Are you sure you want to leave this group?"
    );
    if (!confirmed) return;

    try {
      // TODO: Implement leave group functionality
      alert("Leave group functionality to be implemented");
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Failed to leave group. Please try again.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !currentUser || group.creatorId !== currentUser.uid) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This action cannot be undone and will remove the group for all members."
    );
    if (!confirmed) return;

    try {
      // TODO: Implement delete group functionality
      alert("Delete group functionality to be implemented");
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group. Please try again.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !group || !currentUser || sendingMessage) return;

    // Immediately stop typing indicator locally
    setIsTyping(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Remove typing status from Firebase (don't wait for it)
    if (group && currentUser) {
      removeTypingStatus(group.groupId, currentUser.uid).catch(console.error);
    }

    setSendingMessage(true);
    try {
      await sendMessage({
        groupId: group.groupId,
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <svg
              className="w-16 h-16 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push("/discover")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white px-6 py-2 rounded-lg font-medium transition-all cursor-pointer"
            >
              Back to Discover
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  const isCreator = group.creatorId === currentUser?.uid;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {group.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                {group.subject}
              </span>
              <span>
                {group.members.length}/{group.maxMembers} members
              </span>
              <span>Created {formatDate(group.createdAt)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isCreator ? (
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                Delete Group
              </button>
            ) : (
              <button
                onClick={handleLeaveGroup}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                Leave Group
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard/discover")}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back to Discover
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Goals</h3>
            <p className="text-gray-600">{group.goals}</p>
          </div>

          {group.topics.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Study Sessions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Study Sessions
          </h2>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer"
          >
            Schedule Session
          </button>
        </div>
        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {session.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {session.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 {formatSessionTime(session.scheduledTime)}</span>
                    <span>⏱️ {session.duration} minutes</span>
                    {isSessionActive(session) && (
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                        🔴 Live Now
                      </span>
                    )}
                    {isSessionUpcoming(session) &&
                      !isSessionActive(session) && (
                        <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full font-medium">
                          ⏰ Starting Soon
                        </span>
                      )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {(isSessionActive(session) || isSessionUpcoming(session)) && (
                    <button
                      onClick={() => handleJoinSession(session.sessionId)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                        isSessionActive(session)
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-yellow-600 hover:bg-yellow-700 text-white"
                      }`}
                    >
                      {isSessionActive(session) ? "Join Now" : "Join Soon"}
                    </button>
                  )}
                </div>
              </div>
            ))}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>No study sessions scheduled yet.</p>
          </div>
        )}
      </div>

      {/* Chat/Messages */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Group Chat</h2>
        </div>
        <div className="border border-gray-200 rounded-lg h-64 mb-4 p-4 overflow-y-auto bg-gray-50">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.messageId}
                  className={`flex ${
                    message.senderId === currentUser?.uid
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === currentUser?.uid
                        ? "bg-blue-400 text-white"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    {message.senderId !== currentUser?.uid && (
                      <p className="text-xs text-gray-500 mb-1">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === currentUser?.uid
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
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleMessageInputChange}
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

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm drop-shadow-2xl border-t-2 border-gray-400"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Schedule Study Session
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleScheduleSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Calculus Study Session"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={sessionForm.description}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of what we'll cover..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={sessionForm.time}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={sessionForm.duration}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      duration: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPage;
