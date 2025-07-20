import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/firebase";
import { createUserProfile } from "./users";

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string
): Promise<FirebaseUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    // Create user profile in Firestore
    await createUserProfile(user.uid, {
      name,
      email,
      examTimelines: [],
    });

    return user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Subscribe to auth state changes
export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

// Re-authenticate user with password
export const reauthenticateUser = async (
  user: FirebaseUser,
  password: string
): Promise<void> => {
  try {
    const credential = EmailAuthProvider.credential(user.email!, password);
    await reauthenticateWithCredential(user, credential);
  } catch (error) {
    console.error("Error re-authenticating user:", error);
    throw error;
  }
};

// Delete user account with re-authentication
export const deleteUserAccount = async (
  user: FirebaseUser,
  password: string
): Promise<void> => {
  try {
    // Re-authenticate first for security
    await reauthenticateUser(user, password);

    // Then delete the account
    await deleteUser(user);
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
};
