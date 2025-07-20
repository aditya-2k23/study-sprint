"use client";

import { useRouter } from "next/navigation";
import { StudyGroup } from "@/types";
import { formatDate } from "@/utils";

interface GroupHeaderProps {
  group: StudyGroup;
  isCreator: boolean;
  onLeaveGroup: () => void;
  onDeleteGroup: () => void;
  leavingGroup?: boolean;
  deletingGroup?: boolean;
}

const GroupHeader = ({
  group,
  isCreator,
  onLeaveGroup,
  onDeleteGroup,
  leavingGroup = false,
  deletingGroup = false,
}: GroupHeaderProps) => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {group.name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
              {group.subject}
            </span>
            <span>
              {group.members.length}/{group.maxMembers} members
            </span>
            <span>Created {formatDate(group.createdAt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isCreator ? (
            <button
              onClick={onDeleteGroup}
              disabled={deletingGroup}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingGroup ? "Deleting..." : "Delete Group"}
            </button>
          ) : (
            <button
              onClick={onLeaveGroup}
              disabled={leavingGroup}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {leavingGroup ? "Leaving..." : "Leave Group"}
            </button>
          )}
          <button
            onClick={() => router.push("/discover")}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Back to Discover
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Goals</h3>
          <p className="text-gray-600">{group.goals}</p>
        </div>

        {group.topics.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {group.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupHeader;
