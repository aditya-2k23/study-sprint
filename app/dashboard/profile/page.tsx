"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile, deleteUserProfile } from "@/firebase/users";
import { deleteUserAccount } from "@/firebase/auth";
import {
  updatePassword,
  updateEmail,
  User as FirebaseUser,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import DashboardNav from "@/app/components/DashboardNav";
import { ExamTimeline } from "@/types";

const ProfilePage = () => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profile form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Exam timelines state
  const [examTimelines, setExamTimelines] = useState<ExamTimeline[]>([]);
  const [newExam, setNewExam] = useState({
    examName: "",
    subject: "",
    date: "",
    description: "",
  });

  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        name: userProfile.name || "",
        email: userProfile.email || "",
      }));
      setExamTimelines(userProfile.examTimelines || []);
    }
  }, [userProfile]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExamInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewExam((prev) => ({ ...prev, [name]: value }));
  };

  const addExamTimeline = () => {
    if (!newExam.examName || !newExam.subject || !newExam.date) {
      setMessage({
        type: "error",
        text: "Please fill in all required exam fields.",
      });
      return;
    }

    const examToAdd: ExamTimeline = {
      examName: newExam.examName,
      subject: newExam.subject,
      date: new Date(newExam.date),
      description: newExam.description || undefined,
    };

    setExamTimelines((prev) => [...prev, examToAdd]);
    setNewExam({ examName: "", subject: "", date: "", description: "" });
    setMessage({ type: "success", text: "Exam timeline added successfully!" });
  };

  const removeExamTimeline = (index: number) => {
    setExamTimelines((prev) => prev.filter((_, i) => i !== index));
    setMessage({
      type: "success",
      text: "Exam timeline removed successfully!",
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    setSaving(true);
    try {
      // Update profile in Firestore
      await updateUserProfile(currentUser.uid, {
        name: formData.name,
        examTimelines: examTimelines,
      });

      // Update email if changed
      if (formData.email !== currentUser.email && formData.email.trim()) {
        await updateEmail(currentUser as FirebaseUser, formData.email);
      }

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("New passwords don't match");
        }
        if (formData.newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }
        await updatePassword(currentUser as FirebaseUser, formData.newPassword);
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (!currentUser || !deletePassword.trim()) {
      setMessage({
        type: "error",
        text: "Please enter your password to confirm account deletion.",
      });
      return;
    }

    setDeleting(true);
    try {
      // Delete user profile from Firestore first
      await deleteUserProfile(currentUser.uid);

      // Then delete the authentication account with re-authentication
      await deleteUserAccount(currentUser as FirebaseUser, deletePassword);

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to delete account. Please try again.",
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeletePassword("");
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setDeletePassword("");
  };

  if (!currentUser) {
    router.push("/login");
    return null;
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings and exam timelines
            </p>
          </div>

          {message && (
            <div
              className={`mx-6 mt-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Change Password
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
            </div>

            {/* Exam Timelines */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Exam Timelines
              </h2>

              {/* Existing Exams */}
              {examTimelines.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Your Upcoming Exams
                  </h3>
                  <div className="space-y-3">
                    {examTimelines.map((exam, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {exam.examName}
                            </h4>
                            <p className="text-gray-600">
                              Subject: {exam.subject}
                            </p>
                            <p className="text-gray-600">
                              Date: {new Date(exam.date).toLocaleDateString()}
                            </p>
                            {exam.description && (
                              <p className="text-gray-600 mt-1">
                                {exam.description}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExamTimeline(index)}
                            className="text-red-600 hover:text-red-700 font-medium ml-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Exam */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Add New Exam Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="examName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Exam Name *
                    </label>
                    <input
                      type="text"
                      id="examName"
                      name="examName"
                      value={newExam.examName}
                      onChange={handleExamInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Final Semester Exam"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={newExam.subject}
                      onChange={handleExamInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Exam Date *
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={newExam.date}
                      onChange={handleExamInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={newExam.description}
                      onChange={handleExamInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes about the exam"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addExamTimeline}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Exam Timeline
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white px-8 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-4">
              Danger Zone
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-lg font-medium text-red-900">
                    Delete Account
                  </h3>
                  <p className="text-red-700 text-sm mt-1">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm drop-shadow-2xl z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-900 mb-4">
              Confirm Account Deletion
            </h3>
            <p className="text-gray-700 mb-4">
              To permanently delete your account, please enter your password to
              confirm this action.
            </p>
            <div className="mb-6">
              <label
                htmlFor="deletePassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="deletePassword"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your current password"
                disabled={deleting}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteAccount}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={deleting || !deletePassword.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;
