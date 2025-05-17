
export type TaskCategory = "Assignment" | "Class" | "Personal";

export interface Task {
  id: string;
  description: string;
  dueDate: string; // ISO string date
  category: TaskCategory;
  isCompleted: boolean;
  createdAt: string; // ISO string date for reference
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
  timestamp: number; // Added timestamp
}

export interface StudentAssistantInput {
  currentInquiry: string;
  conversationHistory?: ChatMessage[];
  originalTaskContext?: string; 
}

export interface StudentAssistantOutput {
  assistantResponse: string;
  identifiedTaskType: "writing" | "coding" | "planning_reminder" | "general_query" | "unknown";
}

