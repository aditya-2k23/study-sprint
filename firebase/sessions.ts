import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface StudySession {
  sessionId: string;
  groupId: string;
  title: string;
  description: string;
  scheduledTime: Timestamp;
  duration: number; // in minutes
  createdBy: string;
  createdAt: Timestamp;
  isActive: boolean;
}

// Create a new study session
export const createSession = async (
  groupId: string,
  sessionData: {
    title: string;
    description: string;
    scheduledTime: Date;
    duration: number;
    createdBy: string;
  }
): Promise<string> => {
  try {
    const sessionDoc = await addDoc(collection(db, "sessions"), {
      groupId,
      title: sessionData.title,
      description: sessionData.description,
      scheduledTime: Timestamp.fromDate(sessionData.scheduledTime),
      duration: sessionData.duration,
      createdBy: sessionData.createdBy,
      createdAt: serverTimestamp(),
      isActive: false,
    });

    return sessionDoc.id;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};

// Subscribe to sessions for a specific group
export const subscribeToGroupSessions = (
  groupId: string,
  callback: (sessions: StudySession[]) => void
): (() => void) => {
  try {
    const sessionsQuery = query(
      collection(db, "sessions"),
      where("groupId", "==", groupId),
      orderBy("scheduledTime", "asc")
    );

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      const sessions: StudySession[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          sessionId: doc.id,
          groupId: data.groupId,
          title: data.title,
          description: data.description,
          scheduledTime: data.scheduledTime,
          duration: data.duration,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          isActive: data.isActive,
        });
      });

      callback(sessions);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to sessions:", error);
    return () => {};
  }
};
