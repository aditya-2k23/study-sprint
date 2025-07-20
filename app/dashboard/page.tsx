"use client";

import { useEffect, useState } from "react";
import { getUserStudyGroups } from "@/firebase/studyGroups";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { StudyGroup } from "@/types";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);

  useEffect(() => {
    const loadGroups = async () => {
      if (!currentUser) return;

      try {
        const userGroups = await getUserStudyGroups(currentUser.uid);
        setGroups(userGroups);
      } catch (error) {
        console.error("Error loading user groups:", error);
      }
    };

    if (currentUser) {
      loadGroups();
    }
  }, [currentUser]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening with your study groups today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {groups.length}
              </h3>
              <p className="text-sm text-gray-600">Study Groups</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">0</h3>
              <p className="text-sm text-gray-600">Active Sessions</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">0</h3>
              <p className="text-sm text-gray-600">Completed Goals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/create-group"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Group
          </Link>
          <Link
            href="/dashboard/discover"
            className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Find Groups
          </Link>
        </div>
      </div>

      {/* My Study Groups */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            My Study Groups
          </h2>
          <Link
            href="/dashboard/groups"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </Link>
        </div>

        {groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.slice(0, 6).map((group: StudyGroup) => (
              <Link
                key={group.groupId}
                href={`/dashboard/groups/${group.groupId}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {group.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      group.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {group.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{group.subject}</p>
                <p className="text-sm text-gray-500 mb-3">{group.goals}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {group.members.length}/{group.maxMembers} members
                  </span>
                  <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Study Groups Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first study group or discovering
              existing ones.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/dashboard/create-group"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Create Group
              </Link>
              <Link
                href="/dashboard/discover"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all"
              >
                Discover Groups
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
