"use client";

import { useMemo } from 'react';
import useLocalStorage from './useLocalStorage';
import type { Task } from '@/types';
import { formatISO } from 'date-fns';

export function useTaskManager() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('upnext_tasks', []);

  // Helpers to simulate Firestore-like operations locally

  const addTask = (newTask: Task) => {
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) => 
      prevTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    // We do soft delete (trash) logic here if "delete" means move to trash
    // But if we want actual delete, we filter. 
    // Usually standard delete in this app moves to trash first (updateTask isTrashed=true)
    // This function is for PERMANENT delete if needed features arise.
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
  };

  const trashTask = (taskId: string) => {
    updateTask(taskId, { isTrashed: true, trashedAt: new Date().toISOString() });
  };
  
  const restoreTask = (taskId: string) => {
    updateTask(taskId, { isTrashed: false, trashedAt: null });
  };

  const batchUpdateTasks = (updates: {id: string, data: Partial<Task>}[]) => {
     setTasks((prevTasks) => {
         const newTasks = [...prevTasks];
         updates.forEach(update => {
             const index = newTasks.findIndex(t => t.id === update.id);
             if (index !== -1) {
                 newTasks[index] = { ...newTasks[index], ...update.data };
             }
         });
         return newTasks;
     });
  };

  return {
    tasks,
    setTasks, // Direct setter if needed
    addTask,
    updateTask,
    deleteTask,
    trashTask,
    restoreTask,
    batchUpdateTasks
  };
}
