"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { StudySession, createSession } from "@/firebase/sessions";

interface SessionManagerProps {
  groupId: string;
  currentUserId: string;
  sessions: StudySession[];
}

const SessionManager = ({
  groupId,
  currentUserId,
  sessions,
}: SessionManagerProps) => {
  const router = useRouter();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: 60, // in minutes
  });

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const scheduledDateTime = new Date(
        `${sessionForm.date}T${sessionForm.time}`
      );

      if (scheduledDateTime < new Date()) {
        alert("Please select a future date and time");
        return;
      }

      // Save session to Firebase
      await createSession(groupId, {
        title: sessionForm.title,
        description: sessionForm.description,
        scheduledTime: scheduledDateTime,
        duration: sessionForm.duration,
        createdBy: currentUserId,
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

  return (
    <>
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
    </>
  );
};

export default SessionManager;
