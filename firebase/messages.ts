import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Unsubscribe,
  limit,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Message } from "@/types";

// Send a message to a study group
export const sendMessage = async (
  messageData: Omit<Message, "messageId" | "timestamp">
): Promise<string> => {
  try {
    const messagesRef = collection(
      db,
      "studyGroups",
      messageData.groupId,
      "messages"
    );
    const docRef = await addDoc(messagesRef, {
      ...messageData,
      timestamp: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Get messages for a study group
export const getGroupMessages = async (
  groupId: string,
  limitCount: number = 50
): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, "studyGroups", groupId, "messages");
    const q = query(
      messagesRef,
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({
        messageId: doc.id,
        ...doc.data(),
      } as Message);
    });

    // Reverse to show oldest first
    return messages.reverse();
  } catch (error) {
    console.error("Error getting group messages:", error);
    throw error;
  }
};

// Subscribe to messages in real-time
export const subscribeToGroupMessages = (
  groupId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  const messagesRef = collection(db, "studyGroups", groupId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({
        messageId: doc.id,
        ...doc.data(),
      } as Message);
    });
    callback(messages);
  });

  return unsubscribe;
};

// Get unread messages count for a user in a group
export const getUnreadMessagesCount = async (
  groupId: string,
  userId: string
): Promise<number> => {
  try {
    const messagesRef = collection(db, "studyGroups", groupId, "messages");
    const q = query(
      messagesRef,
      where("isRead", "==", false),
      where("senderId", "!=", userId)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting unread messages count:", error);
    throw error;
  }
};
