
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

const breakpointColumnsObj = {
  default: 4, // 4 columns for large screens
  1280: 3,    // 3 columns for typical desktop
  1024: 3,    // 3 columns for smaller desktops/large tablets
  768: 2,     // 2 columns for tablets
  640: 1      // 1 column for mobile
};


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
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-full -ml-4 py-4" // Negative margin to counteract item padding, if item has padding
      columnClassName="pl-4 bg-clip-padding" // Add padding to column, children will fill it
    >
      {tasks.map((task) => (
        <div key={task.id} className="mb-4"> {/* Add margin bottom to each item wrapper */}
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

