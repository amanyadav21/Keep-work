export type TaskCategory = "Assignment" | "Class" | "Personal";

export interface Task {
  id: string;
  description: string;
  dueDate: string; // ISO string date
  category: TaskCategory;
  isCompleted: boolean;
  createdAt: string; // ISO string date for sorting or reference
}

export type TaskFilter = "all" | "pending" | "completed";
