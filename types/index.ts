// User interface
export interface User {
  uid: string;
  name: string;
  email: string;
  examTimelines: ExamTimeline[];
  createdAt: Date;
  updatedAt: Date;
}

// Exam Timeline interface
export interface ExamTimeline {
  examName: string;
  subject: string;
  date: Date;
  description?: string;
}

// Study Group interface
export interface StudyGroup {
  groupId: string;
  name: string;
  subject: string;
  topics: string[];
  goals: string;
  members: string[]; // Array of user UIDs
  creatorId: string;
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
  nextMeetingDate?: Date;
  isActive: boolean;
}

// Message interface
export interface Message {
  messageId: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

// Study Group with member details (for display)
export interface StudyGroupWithMembers extends StudyGroup {
  memberDetails: User[];
}

// User's study group membership
export interface UserGroupMembership {
  groupId: string;
  joinedAt: Date;
  role: 'member' | 'admin';
}
