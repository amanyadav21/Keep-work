
"use client";

import type { Task } from '@/types';
import { TaskItem } from './TaskItem';
import { Lightbulb } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id:string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

export function TaskList({ tasks, onToggleComplete, onEdit, onDelete, onToggleSubtask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <Lightbulb className="mx-auto h-16 w-16 text-muted-foreground/40 mb-4" strokeWidth={1} />
        <h3 className="text-xl font-semibold text-foreground mb-1">No tasks here</h3>
        <p className="text-md text-muted-foreground">Tasks you add or that match your filter will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleSubtask={onToggleSubtask}
        />
      ))}
    </div>
  );
}
