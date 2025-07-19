import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import { User } from "@/types";

// Create a new user profile
export const createUserProfile = async (
  uid: string,
  userData: Omit<User, "uid" | "createdAt" | "updatedAt">
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      ...userData,
      uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

// Get user profile by UID
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<User>
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Get users by exam timeline (for matching)
export const getUsersByExamTimeline = async (
  subject: string,
  examDate: Date
): Promise<User[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef);
    const querySnapshot = await getDocs(q);

    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as User;
      // Filter users with matching exam timelines
      const hasMatchingExam = userData.examTimelines.some(
        (exam) =>
          exam.subject === subject &&
          new Date(exam.date).toDateString() === examDate.toDateString()
      );
      if (hasMatchingExam) {
        users.push(userData);
      }
    });

    return users;
  } catch (error) {
    console.error("Error getting users by exam timeline:", error);
    throw error;
  }
};
