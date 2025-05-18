
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { FilterControls } from '@/components/FilterControls';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Task, TaskFilter, PrioritizedTaskSuggestion } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PrioritySuggestionsModal } from '@/components/PrioritySuggestionsModal';
import { DashboardSection } from '@/components/DashboardSection'; // New Dashboard section
import { formatISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskPriorities, type FlowTaskInput } from '@/ai/flows/prioritize-tasks-flow';
import { Button } from '@/components/ui/button';
import { MessageSquareText } from 'lucide-react';

interface HomePageProps {
  params: { [key: string]: string | string[] | undefined };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function HomePage({ params, searchParams }: HomePageProps) {
  const [tasks, setTasks] = useLocalStorage<Task[]>('studentTasks', []);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [prioritySuggestions, setPrioritySuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  const [isSuggestingPriorities, setIsSuggestingPriorities] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const handleAddTask = useCallback((data: TaskFormValues) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      description: data.description,
      dueDate: formatISO(data.dueDate),
      category: data.category,
      isCompleted: false,
      createdAt: formatISO(new Date()),
      subtasks: data.subtasks?.map(st => ({
        id: st.id || crypto.randomUUID(),
        text: st.text,
        isCompleted: st.isCompleted || false,
      })) || [],
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  }, [setTasks]);

  const handleEditTask = useCallback((data: TaskFormValues, taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              description: data.description,
              dueDate: formatISO(data.dueDate),
              category: data.category,
              subtasks: data.subtasks?.map(st => ({
                id: st.id || crypto.randomUUID(),
                text: st.text,
                isCompleted: st.isCompleted || false,
              })) || [],
            }
          : task
      )
    );
    setEditingTask(null);
  }, [setTasks]);

  const handleSubmitTask = useCallback((data: TaskFormValues, existingTaskId?: string) => {
    if (existingTaskId) {
      handleEditTask(data, existingTaskId);
    } else {
      handleAddTask(data);
    }
    setIsFormOpen(false);
  }, [handleAddTask, handleEditTask]);

  const handleToggleComplete = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
    if (task) {
      toast({
        title: `Task ${!task.isCompleted ? "Completed" : "Marked Pending"}`,
      });
    }
  }, [setTasks, tasks, toast]);

  const handleToggleSubtaskComplete = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks?.map(st =>
                st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
              ),
            }
          : task
      )
    );
  }, [setTasks]);

  const handleOpenEditForm = useCallback((task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }, [setEditingTask, setIsFormOpen]);

  const handleOpenAddForm = useCallback(() => {
    setEditingTask(null);
    setIsFormOpen(true);
  }, [setEditingTask, setIsFormOpen]);

  const handleDeleteTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    setTaskToDelete(null);
    if (task) {
      toast({
        title: "Task Deleted",
        variant: "destructive",
      });
    }
  }, [setTasks, tasks, toast]);

  const sortedTasks = useMemo(() => {
    if (!isMounted) return [];
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
      default:
        return sortedTasks;
    }
  }, [sortedTasks, filter, isMounted]);

  const pendingTasksForAI = useMemo(() => {
    return tasks
      .filter(task => !task.isCompleted)
      .map(task => ({
        id: task.id,
        description: task.description,
        dueDate: task.dueDate,
        category: task.category,
      } as FlowTaskInput));
  }, [tasks]);

  const handleSuggestPriorities = useCallback(async () => {
    if (pendingTasksForAI.length === 0) {
      toast({
        title: "No Pending Tasks",
        description: "Add some tasks or mark existing ones as pending to get priority suggestions.",
      });
      return;
    }
    setIsSuggestingPriorities(true);
    setIsPriorityModalOpen(true);
    setPrioritySuggestions([]);
    try {
      const result = await suggestTaskPriorities({ tasks: pendingTasksForAI });
      const enrichedSuggestions = result.prioritizedSuggestions.map(suggestion => {
        const task = tasks.find(t => t.id === suggestion.taskId);
        return {
          ...suggestion,
          description: task ? task.description : "Unknown Task",
        };
      });
      setPrioritySuggestions(enrichedSuggestions);
    } catch (error) {
      console.error("AI priority suggestion error:", error);
      toast({
        title: "AI Suggestion Failed",
        description: "Could not get priority suggestions at this time.",
        variant: "destructive",
      });
    } finally {
      setIsSuggestingPriorities(false);
    }
  }, [pendingTasksForAI, tasks, toast]);

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header onAddTask={() => {}} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="container mx-auto w-full">
            <div className="h-10 bg-muted rounded-lg w-full sm:w-3/4 md:w-1/2 mb-6 animate-pulse"></div> {/* Filter placeholder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[180px] bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
             <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Dashboard skeleton */}
              <div className="h-60 bg-muted rounded-lg animate-pulse"></div>
              <div className="h-60 bg-muted rounded-lg animate-pulse"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onAddTask={handleOpenAddForm} />
      {/* Main content area for tasks */}
      <main className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-6">
        <div className="container mx-auto w-full">
          <div className="mb-6">
            <FilterControls currentFilter={filter} onFilterChange={setFilter} />
          </div>
          <TaskList
            tasks={filteredTasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleOpenEditForm}
            onDelete={(id) => setTaskToDelete(id)}
            onToggleSubtask={handleToggleSubtaskComplete}
          />
        </div>
      </main>

      {/* Dashboard Section below tasks */}
      <DashboardSection
        tasks={tasks}
        onSuggestPriorities={handleSuggestPriorities}
        isPrioritizing={isSuggestingPriorities}
      />

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

      <PrioritySuggestionsModal
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        suggestions={prioritySuggestions}
        isLoading={isSuggestingPriorities}
      />

      <Button asChild size="lg" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30 p-0">
        <Link href="/ai-assistant" aria-label="Open AI Assistant">
          <MessageSquareText className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  );
}
