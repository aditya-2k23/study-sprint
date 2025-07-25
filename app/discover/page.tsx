"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveStudyGroups, joinStudyGroup } from "@/firebase/studyGroups";
import { useAuth } from "@/context/AuthContext";
import { StudyGroup } from "@/types";
import { formatDate } from "@/utils";
import DashboardNav from "../components/DashboardNav";
import Link from "next/link";

const DiscoverPage = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<StudyGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<string | null>(null);

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Engineering",
    "Medicine",
    "Business",
    "Economics",
    "Psychology",
  ];

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    filterGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, searchTerm, selectedSubject]);

  const loadGroups = async (): Promise<void> => {
    try {
      const activeGroups = await getActiveStudyGroups();
      // Show all groups, even those the user is already a member of
      setGroups(activeGroups);
      setLoading(false);
    } catch (error) {
      console.error("Error loading groups:", error);
      setLoading(false);
    }
  };

  const filterGroups = (): void => {
    let filtered = groups;

    if (searchTerm) {
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.topics.some((topic) =>
            topic.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter((group) => group.subject === selectedSubject);
    }

    setFilteredGroups(filtered);
  };

  const handleJoinGroup = async (groupId: string): Promise<void> => {
    if (!currentUser || joining === groupId) return;

    setJoining(groupId);
    try {
      await joinStudyGroup(groupId, currentUser.uid);
      router.push(`/group/${groupId}`);
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group. Please try again.");
    } finally {
      setJoining(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading study groups...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Study Groups
          </h1>
          <p className="text-gray-600">
            Find and join study groups that match your interests and goals.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search Groups
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name, subject, or topics..."
              />
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filter by Subject
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredGroups.length} Groups Found
          </h2>
        </div>

        {filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Link
                href={`/group/${group.groupId}`}
                key={group.groupId}
                className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {group.name}
                    </h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                      {group.subject}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {group.goals}
                  </p>

                  {group.topics.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {group.topics.slice(0, 3).map((topic, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {topic}
                          </span>
                        ))}
                        {group.topics.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{group.topics.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>
                      {group.members.length}/{group.maxMembers} members
                    </span>
                    <span>Created {formatDate(group.createdAt)}</span>
                  </div>

                  <button
                    onClick={() => handleJoinGroup(group.groupId)}
                    disabled={
                      joining === group.groupId ||
                      group.members.length >= group.maxMembers ||
                      group.members.includes(currentUser?.uid ?? "")
                    }
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                      group.members.length >= group.maxMembers
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : joining === group.groupId
                        ? "bg-blue-400 text-white cursor-not-allowed"
                        : group.members.includes(currentUser?.uid ?? "")
                        ? "bg-blue-100 text-blue-400 font-semibold cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white cursor-pointer"
                    }`}
                  >
                    {group.members.length >= group.maxMembers
                      ? "Group Full"
                      : joining === group.groupId
                      ? "Joining..."
                      : group.members.includes(currentUser?.uid ?? "")
                      ? "Already a Member"
                      : "Join Group"}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Groups Found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedSubject
                ? "No groups match your current filters. Try adjusting your search criteria."
                : "No study groups are currently available. Why not create one?"}
            </p>
            {!searchTerm && !selectedSubject && (
              <button
                onClick={() => router.push("/dashboard/create-group")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white px-6 py-2 rounded-lg font-medium transition-all cursor-pointer"
              >
                Create Group
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default DiscoverPage;
