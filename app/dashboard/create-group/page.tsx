"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStudyGroup } from "@/firebase/studyGroups";
import { useAuth } from "@/context/AuthContext";

const CreateGroupPage = () => {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    goals: "",
    topics: [] as string[],
    maxMembers: 10,
    nextMeetingDate: "",
  });

  const [topicInput, setTopicInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
    }

    if (!formData.subject) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.goals.trim()) {
      newErrors.goals = "Group goals are required";
    }

    if (formData.maxMembers < 2 || formData.maxMembers > 50) {
      newErrors.maxMembers = "Maximum members must be between 2 and 50";
    }

    if (formData.topics.length === 0) {
      newErrors.topics = "At least one topic is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxMembers" ? parseInt(value) || 0 : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const addTopic = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, topicInput.trim()],
      }));
      setTopicInput("");

      // Clear topics error if exists
      if (errors.topics) {
        setErrors((prev) => ({ ...prev, topics: "" }));
      }
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((topic) => topic !== topicToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTopic();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert("You must be logged in to create a group");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const groupData = {
        name: formData.name.trim(),
        subject: formData.subject,
        goals: formData.goals.trim(),
        topics: formData.topics,
        maxMembers: formData.maxMembers,
        creatorId: currentUser.uid,
        members: [currentUser.uid],
        isActive: true,
        ...(formData.nextMeetingDate && {
          nextMeetingDate: new Date(formData.nextMeetingDate),
        }),
      };

      const newGroupId = await createStudyGroup(groupData);

      // Redirect to the new group's page
      router.push(`/group/${newGroupId}`);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create a Study Group
        </h1>
        <p className="text-gray-600">
          Start a new study group and connect with like-minded learners.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter a descriptive name for your study group"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Subject *
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.subject ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Goals */}
          <div>
            <label
              htmlFor="goals"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Group Goals *
            </label>
            <textarea
              id="goals"
              name="goals"
              value={formData.goals}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.goals ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Describe what you hope to achieve with this study group..."
              maxLength={500}
            />
            {errors.goals && (
              <p className="text-red-500 text-sm mt-1">{errors.goals}</p>
            )}
          </div>

          {/* Topics */}
          <div>
            <label
              htmlFor="topic-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Topics *
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                id="topic-input"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a topic (e.g., Calculus, Organic Chemistry)"
                maxLength={50}
              />
              <button
                type="button"
                onClick={addTopic}
                disabled={!topicInput.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Add
              </button>
            </div>

            {formData.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => removeTopic(topic)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {errors.topics && (
              <p className="text-red-500 text-sm mt-1">{errors.topics}</p>
            )}
          </div>

          {/* Max Members */}
          <div>
            <label
              htmlFor="maxMembers"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Maximum Members *
            </label>
            <input
              type="number"
              id="maxMembers"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleInputChange}
              min="2"
              max="50"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.maxMembers ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.maxMembers && (
              <p className="text-red-500 text-sm mt-1">{errors.maxMembers}</p>
            )}
          </div>

          {/* Next Meeting Date (Optional) */}
          <div>
            <label
              htmlFor="nextMeetingDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Next Meeting Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="nextMeetingDate"
              name="nextMeetingDate"
              value={formData.nextMeetingDate}
              onChange={handleInputChange}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupPage;
