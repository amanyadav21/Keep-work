"use client";

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { FilterControls } from '@/components/FilterControls';
import { TaskStats } from '@/components/TaskStats';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Task, TaskCategory, TaskFilter } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle } from 'lucide-react';
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

  // Hydration check
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
    setTasks(prevTasks => [...prevTasks, newTask].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  };

  const handleEditTask = (data: TaskFormData, taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...data, dueDate: formatISO(data.dueDate) }
          : task
      ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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
        description: `"${task.description}" status updated.`,
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
    setTaskToDelete(null); // Close confirmation dialog
    if (task) {
      toast({
        title: "Task Deleted",
        description: `"${task.description}" has been deleted.`,
        variant: "destructive",
      });
    }
  };

  const filteredTasks = useMemo(() => {
    if (!isMounted) return []; // Return empty array or placeholder during SSR / before mount
    let sortedTasks = [...tasks].sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Further sort by completion status: pending tasks first
    sortedTasks = sortedTasks.sort((a,b) => {
      if (a.isCompleted === b.isCompleted) return 0;
      return a.isCompleted ? 1 : -1;
    });

    switch (filter) {
      case 'pending':
        return sortedTasks.filter(task => !task.isCompleted);
      case 'completed':
        return sortedTasks.filter(task => task.isCompleted);
      default: // 'all'
        return sortedTasks;
    }
  }, [tasks, filter, isMounted]);

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header onAddTask={() => {}} />
        <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-10 bg-muted rounded-lg w-1/2"></div>
            <div className="h-16 bg-muted rounded-lg"></div>
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onAddTask={handleOpenAddForm} />
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-semibold text-foreground">Your Tasks</h2>
              <FilterControls currentFilter={filter} onFilterChange={setFilter} />
            </div>
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEditForm}
              onDelete={(id) => setTaskToDelete(id)} 
            />
          </div>
          <aside className="lg:col-span-1 space-y-6">
             <TaskStats tasks={tasks} />
             {/* You could add more things to the sidebar here, like a calendar view or upcoming deadlines summary */}
          </aside>
        </div>
      </main>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingTask(null); // Reset editing task when dialog closes
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{tasks.find(t => t.id === taskToDelete)?.description}".
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
