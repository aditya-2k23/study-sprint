import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

export interface TypingStatus {
  userId: string;
  userName: string;
  groupId: string;
  timestamp: Timestamp | null;
}

// Set typing status for a user in a group
export const setTypingStatus = async (
  groupId: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const typingRef = doc(db, "typing", `${groupId}_${userId}`);
    await setDoc(typingRef, {
      userId,
      userName,
      groupId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error setting typing status:", error);
    throw error;
  }
};

// Remove typing status for a user in a group
export const removeTypingStatus = async (
  groupId: string,
  userId: string
): Promise<void> => {
  try {
    const typingRef = doc(db, "typing", `${groupId}_${userId}`);
    await deleteDoc(typingRef);
  } catch (error) {
    console.error("Error removing typing status:", error);
    throw error;
  }
};

// Subscribe to typing status updates for a group
export const subscribeToTypingStatus = (
  groupId: string,
  currentUserId: string,
  callback: (typingUsers: string[]) => void
): (() => void) => {
  try {
    const typingQuery = query(
      collection(db, "typing"),
      where("groupId", "==", groupId)
    );

    const unsubscribe = onSnapshot(typingQuery, (snapshot) => {
      const typingUsers: string[] = [];
      const now = Date.now();

      snapshot.forEach((doc) => {
        const data = doc.data() as TypingStatus;
        // Only show typing status for other users, not current user
        if (data.userId !== currentUserId) {
          // Check if typing status is recent (within last 5 seconds)
          const typingTime = data.timestamp?.toDate?.()?.getTime() || 0;
          if (now - typingTime < 5000) {
            typingUsers.push(data.userName);
          }
        }
      });

      callback(typingUsers);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to typing status:", error);
    return () => {};
  }
};

// Clean up old typing statuses (helper function)
export const cleanupOldTypingStatuses = async (
  groupId: string
): Promise<void> => {
  try {
    // This could be called periodically to clean up old typing statuses
    // For now, we'll rely on the timestamp check in the subscription
    console.log("Cleanup function called for group:", groupId);
  } catch (error) {
    console.error("Error cleaning up typing statuses:", error);
  }
};

// Delete all typing statuses for a group
export const deleteGroupTypingStatuses = async (
  groupId: string
): Promise<void> => {
  try {
    const typingRef = collection(db, "typing");
    const q = query(typingRef, where("groupId", "==", groupId));
    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map((document) =>
      deleteDoc(doc(db, "typing", document.id))
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting group typing statuses:", error);
    throw error;
  }
};
