
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
  default: 4, 
  1440: 4, // XL screens
  1280: 3, // Large desktops
  1024: 3, // Desktops/Large tablets
  768: 2,  // Tablets
  640: 1   // Mobile (sm)
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
      className="flex w-auto -ml-4" // Adjusted w-full to w-auto, still use negative margin for item padding
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


    