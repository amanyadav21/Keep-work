
import type { User as FirebaseUserType } from 'firebase/auth';

export type TaskCategory = "General" | "Assignment" | "Class" | "Personal";
export type TaskPriority = "Urgent" | "High" | "Medium" | "Low" | "None";

export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string date
  category: TaskCategory;
  priority?: TaskPriority;
  isCompleted: boolean;
  createdAt: string; // ISO string date for reference
  subtasks?: Subtask[];
  userId?: string;
  isTrashed?: boolean;
  trashedAt?: string | null; // ISO string date or null
  reminderAt?: string | null; // ISO string date-time or null for reminders
}

export type TaskFilter = "all" | "pending" | "completed" | "today" | "general";

// For Student Assistant (Chat)
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type FirebaseUser = FirebaseUserType;

