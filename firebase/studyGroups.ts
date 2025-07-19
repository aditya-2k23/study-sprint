import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/firebase";
import { StudyGroup, StudyGroupWithMembers } from "@/types";
import { getUserProfile } from "./users";

// Create a new study group
export const createStudyGroup = async (
  groupData: Omit<StudyGroup, "groupId" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const studyGroupsRef = collection(db, "studyGroups");
    const docRef = await addDoc(studyGroupsRef, {
      ...groupData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update the document with its ID
    await updateDoc(docRef, { groupId: docRef.id });

    return docRef.id;
  } catch (error) {
    console.error("Error creating study group:", error);
    throw error;
  }
};

// Get study group by ID
export const getStudyGroup = async (
  groupId: string
): Promise<StudyGroup | null> => {
  try {
    const groupRef = doc(db, "studyGroups", groupId);
    const groupSnap = await getDoc(groupRef);

    if (groupSnap.exists()) {
      return groupSnap.data() as StudyGroup;
    }
    return null;
  } catch (error) {
    console.error("Error getting study group:", error);
    throw error;
  }
};

// Get study group with member details
export const getStudyGroupWithMembers = async (
  groupId: string
): Promise<StudyGroupWithMembers | null> => {
  try {
    const group = await getStudyGroup(groupId);
    if (!group) return null;

    const memberDetails = await Promise.all(
      group.members.map((uid) => getUserProfile(uid))
    );

    return {
      ...group,
      memberDetails: memberDetails.filter(
        (member): member is NonNullable<typeof member> => member !== null
      ),
    };
  } catch (error) {
    console.error("Error getting study group with members:", error);
    throw error;
  }
};

// Get all active study groups
export const getActiveStudyGroups = async (): Promise<StudyGroup[]> => {
  try {
    const groupsRef = collection(db, "studyGroups");
    const q = query(groupsRef, where("isActive", "==", true));
    const querySnapshot = await getDocs(q);

    const groups: StudyGroup[] = [];
    querySnapshot.forEach((doc) => {
      groups.push(doc.data() as StudyGroup);
    });

    return groups;
  } catch (error) {
    console.error("Error getting active study groups:", error);
    throw error;
  }
};

// Get study groups by subject
export const getStudyGroupsBySubject = async (
  subject: string
): Promise<StudyGroup[]> => {
  try {
    const groupsRef = collection(db, "studyGroups");
    const q = query(
      groupsRef,
      where("subject", "==", subject),
      where("isActive", "==", true)
    );
    const querySnapshot = await getDocs(q);

    const groups: StudyGroup[] = [];
    querySnapshot.forEach((doc) => {
      groups.push(doc.data() as StudyGroup);
    });

    return groups;
  } catch (error) {
    console.error("Error getting study groups by subject:", error);
    throw error;
  }
};

// Get user's study groups
export const getUserStudyGroups = async (
  userId: string
): Promise<StudyGroup[]> => {
  try {
    const groupsRef = collection(db, "studyGroups");
    const q = query(groupsRef, where("members", "array-contains", userId));
    const querySnapshot = await getDocs(q);

    const groups: StudyGroup[] = [];
    querySnapshot.forEach((doc) => {
      groups.push(doc.data() as StudyGroup);
    });

    return groups;
  } catch (error) {
    console.error("Error getting user study groups:", error);
    throw error;
  }
};

// Join a study group
export const joinStudyGroup = async (
  groupId: string,
  userId: string
): Promise<void> => {
  try {
    const groupRef = doc(db, "studyGroups", groupId);
    const group = await getStudyGroup(groupId);

    if (!group) throw new Error("Study group not found");
    if (group.members.length >= group.maxMembers)
      throw new Error("Study group is full");
    if (group.members.includes(userId))
      throw new Error("Already a member of this group");

    await updateDoc(groupRef, {
      members: arrayUnion(userId),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error joining study group:", error);
    throw error;
  }
};

// Leave a study group
export const leaveStudyGroup = async (
  groupId: string,
  userId: string
): Promise<void> => {
  try {
    const groupRef = doc(db, "studyGroups", groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error leaving study group:", error);
    throw error;
  }
};

// Update study group
export const updateStudyGroup = async (
  groupId: string,
  updates: Partial<StudyGroup>
): Promise<void> => {
  try {
    const groupRef = doc(db, "studyGroups", groupId);
    await updateDoc(groupRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating study group:", error);
    throw error;
  }
};
