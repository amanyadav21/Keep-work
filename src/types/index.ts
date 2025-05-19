
import type { User as FirebaseUserType } from 'firebase/auth'; // Import Firebase User type

export type TaskCategory = "Assignment" | "Class" | "Personal";

export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  description: string;
  dueDate: string; // ISO string date
  category: TaskCategory;
  isCompleted: boolean;
  createdAt: string; // ISO string date for reference
  subtasks?: Subtask[];
  userId?: string; // Optional: to explicitly store the user ID with the task
}

export type TaskFilter = "all" | "pending" | "completed";

export interface PrioritizedTaskSuggestion {
  taskId: string;
  description: string; 
  reason: string;
}

// For Student Assistant Flow
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  identifiedTaskType?: StudentAssistantOutput['identifiedTaskType'];
}

export interface StudentAssistantInput {
  currentInquiry: string;
  conversationHistory?: Omit<ChatMessage, 'identifiedTaskType'>[]; // AI doesn't need its own identified type in history
  originalTaskContext?: string; 
}

export interface StudentAssistantOutput {
  assistantResponse: string;
  identifiedTaskType: "writing" | "coding" | "planning_reminder" | "general_query" | "brainstorming_elaboration" | "unknown";
}

// Firebase User type (can be extended if you store more profile info)
export type FirebaseUser = FirebaseUserType;
