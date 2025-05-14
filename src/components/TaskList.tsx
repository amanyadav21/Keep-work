"use client";

import type { Task } from '@/types';
import { TaskItem } from './TaskItem';
import { AnimatePresence, motion } from 'framer-motion'; // For animations (optional)

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onToggleComplete, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-muted-foreground">No tasks yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <TaskItem
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Ensure framer-motion is installed: npm install framer-motion
// If not using framer-motion, remove AnimatePresence and motion.div,
// and use a simple div for mapping:
// <div className="space-y-4">
//   {tasks.map((task) => (
//     <TaskItem key={task.id} ... />
//   ))}
// </div>
