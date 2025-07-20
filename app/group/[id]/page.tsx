"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { StudyGroup, Message } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { sendMessage, subscribeToGroupMessages } from "@/firebase/messages";
import {
  setTypingStatus,
  removeTypingStatus,
  subscribeToTypingStatus,
} from "@/firebase/typing";
import { subscribeToGroupSessions, StudySession } from "@/firebase/sessions";
import { deleteStudyGroup, leaveStudyGroup } from "@/firebase/studyGroups";
import GroupHeader from "@/app/components/GroupHeader";
import SessionManager from "@/app/components/SessionManager";
import Chat from "@/app/components/Chat";
import DashboardNav from "@/app/components/DashboardNav";

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
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadGroup = useCallback(async () => {
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
  }, [id, currentUser]);

  useEffect(() => {
    if (!id || !currentUser) return;
    loadGroup();
  }, [id, currentUser, loadGroup]);

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

  const handleLeaveGroup = async () => {
    if (!group || !currentUser || leavingGroup) return;

    const confirmed = window.confirm(
      "Are you sure you want to leave this group?"
    );
    if (!confirmed) return;

    setLeavingGroup(true);
    try {
      await leaveStudyGroup(group.groupId, currentUser.uid);

      // Show success message and redirect to dashboard
      alert("You have left the group successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error leaving group:", error);

      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to leave group: ${error.message}`);
      } else {
        alert("Failed to leave group. Please try again.");
      }
    } finally {
      setLeavingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !group ||
      !currentUser ||
      group.creatorId !== currentUser.uid ||
      deletingGroup
    )
      return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This action cannot be undone and will remove the group for all members."
    );
    if (!confirmed) return;

    const finalConfirmed = window.confirm(
      "This will permanently delete the group, all messages, sessions, and related data. This action is irreversible. Are you absolutely sure?"
    );
    if (!finalConfirmed) return;

    setDeletingGroup(true);
    try {
      await deleteStudyGroup(group.groupId, currentUser.uid);

      // Show success message and redirect to dashboard
      alert("Group deleted successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting group:", error);

      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to delete group: ${error.message}`);
      } else {
        alert("Failed to delete group. Please try again.");
      }
    } finally {
      setDeletingGroup(false);
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
    <>
      <DashboardNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GroupHeader
          group={group}
          isCreator={isCreator}
          onLeaveGroup={handleLeaveGroup}
          onDeleteGroup={handleDeleteGroup}
          leavingGroup={leavingGroup}
          deletingGroup={deletingGroup}
        />

        <SessionManager
          groupId={group.groupId}
          currentUserId={currentUser?.uid || ""}
          sessions={sessions}
        />

        <Chat
          messages={messages}
          currentUserId={currentUser?.uid || ""}
          newMessage={newMessage}
          onSendMessage={handleSendMessage}
          onMessageInputChange={handleMessageInputChange}
          sendingMessage={sendingMessage}
          typingUsers={typingUsers}
        />
      </div>
    </>
  );
};

export default GroupPage;
