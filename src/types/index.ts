
import type { User as FirebaseUserType } from 'firebase/auth';

export type TaskCategory = "Assignment" | "Class" | "Personal";

export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string; // Added new title field
  description: string;
  dueDate: string; // ISO string date
  category: TaskCategory;
  isCompleted: boolean;
  createdAt: string; // ISO string date for reference
  subtasks?: Subtask[];
  userId?: string;
  isTrashed?: boolean;
  trashedAt?: string | null; // ISO string date or null
}

export type TaskFilter = "all" | "pending" | "completed";

// For Student Assistant (Chat)
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type FirebaseUser = FirebaseUserType;

