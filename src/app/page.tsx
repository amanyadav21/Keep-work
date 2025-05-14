
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { FilterControls } from '@/components/FilterControls';
import { TaskStats } from '@/components/TaskStats';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Task, TaskCategory, TaskFilter } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface TaskFormData {
  description: string;
  dueDate: Date;
  category: TaskCategory;
}

export default function HomePage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('studentTasks', []);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const handleAddTask = (data: TaskFormData) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      description: data.description,
      dueDate: formatISO(data.dueDate),
      category: data.category,
      isCompleted: false,
      createdAt: formatISO(new Date()),
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleEditTask = (data: TaskFormData, taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...data, dueDate: formatISO(data.dueDate) }
          : task
      )
    );
    setEditingTask(null);
  };

  const handleSubmitTask = (data: TaskFormData, existingTaskId?: string) => {
    if (existingTaskId) {
      handleEditTask(data, existingTaskId);
    } else {
      handleAddTask(data);
    }
    setIsFormOpen(false);
  };

  const handleToggleComplete = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
     const task = tasks.find(t => t.id === id);
    if (task) {
      toast({
        title: `Task ${!task.isCompleted ? "Completed" : "Marked Pending"}`,
        // description: `"${task.description}" status updated.`, // Keep toast concise
      });
    }
  };

  const handleOpenEditForm = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };
  
  const handleOpenAddForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  }

  const handleDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    setTaskToDelete(null); 
    if (task) {
      toast({
        title: "Task Deleted",
        // description: `"${task.description}" has been deleted.`, // Keep toast concise
        variant: "destructive",
      });
    }
  };

  const sortedTasks = useMemo(() => {
    if (!isMounted) return [];
    // Primary sort: pending tasks first, then completed
    // Secondary sort: by due date (earliest first)
    // Tertiary sort: by creation date (earliest first) for tasks with same due date or no due date
    return [...tasks].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      const dueDateA = new Date(a.dueDate).getTime();
      const dueDateB = new Date(b.dueDate).getTime();
      if (dueDateA !== dueDateB) {
        return dueDateA - dueDateB;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [tasks, isMounted]);


  const filteredTasks = useMemo(() => {
    if (!isMounted) return []; 
    switch (filter) {
      case 'pending':
        return sortedTasks.filter(task => !task.isCompleted);
      case 'completed':
        return sortedTasks.filter(task => task.isCompleted);
      default: // 'all'
        return sortedTasks;
    }
  }, [sortedTasks, filter, isMounted]);

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header onAddTask={() => {}} />
        <main className="flex-grow container mx-auto px-4 md:px-6 py-6">
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded-lg w-full sm:w-1/2"></div> {/* Filter placeholder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 bg-muted rounded-lg"></div> 
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onAddTask={handleOpenAddForm} />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
            <FilterControls currentFilter={filter} onFilterChange={setFilter} />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEditForm}
              onDelete={(id) => setTaskToDelete(id)} 
            />
          </div>
          <aside className="xl:col-span-1 space-y-6">
             <TaskStats tasks={tasks} />
          </aside>
        </div>
      </main>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingTask(null);
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSubmit={handleSubmitTask}
            editingTask={editingTask}
            onClose={() => {
              setIsFormOpen(false);
              setEditingTask(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task "{tasks.find(t => t.id === taskToDelete)?.description}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => taskToDelete && handleDeleteTask(taskToDelete)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
