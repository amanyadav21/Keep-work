
"use client";

import type { Task } from '@/types';
import { TaskItem } from './TaskItem';
import { Lightbulb } from 'lucide-react';
import Masonry from 'react-masonry-css';

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

  const breakpointCols = {
    default: 4,
    1536: 3, 
    1280: 3,
    1024: 2,
    768: 2,
    640: 1
  };

  return (
    <Masonry
      breakpointCols={breakpointCols}
      className="flex w-auto -ml-4"
      columnClassName="pl-4 bg-background"
    >
      {tasks.map((task) => (
        <div key={task.id} className="mb-4">
          <TaskItem
            task={task}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleSubtask={onToggleSubtask}
          />
        </div>
      ))}
    </Masonry>
  );
}


    