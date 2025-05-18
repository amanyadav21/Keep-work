
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { FilterControls } from '@/components/FilterControls';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Task, TaskCategory, TaskFilter, PrioritizedTaskSuggestion, StudentAssistantOutput } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PrioritySuggestionsModal } from '@/components/PrioritySuggestionsModal';
import { StudentAssistantModal } from '@/components/StudentAssistantModal';
import { AppSidebar } from '@/components/AppSidebar';
import { formatISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskPriorities, type FlowTaskInput } from '@/ai/flows/prioritize-tasks-flow';
import { getStudentAssistance } from '@/ai/flows/student-assistant-flow';

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

  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [initialAssistantOutput, setInitialAssistantOutput] = useState<StudentAssistantOutput | null>(null);
  const [isRequestingInitialAssistance, setIsRequestingInitialAssistance] = useState(false);
  const [assistingTaskDescription, setAssistingTaskDescription] = useState<string | null>(null);

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
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
     const task = tasks.find(t => t.id === id);
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
  }, []);

  const handleOpenAddForm = useCallback(() => {
    setEditingTask(null);
    setIsFormOpen(true);
  }, []);

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
    if (!isMounted) return []; // Prevent computations if not mounted
    return [...tasks].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      const dueDateA = new Date(a.dueDate).getTime();
      const dueDateB = new Date(b.dueDate).getTime();
      if (dueDateA !== dueDateB) {
        return dueDateA - dueDateB;
      }
      // Fallback sort by creation date if due dates are the same
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [tasks, isMounted]);


  const filteredTasks = useMemo(() => {
    if (!isMounted) return []; // Prevent computations if not mounted
    switch (filter) {
      case 'pending':
        return sortedTasks.filter(task => !task.isCompleted);
      case 'completed':
        return sortedTasks.filter(task => task.isCompleted);
      default: // 'all'
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
    setPrioritySuggestions([]); // Clear previous suggestions
    try {
      const result = await suggestTaskPriorities({ tasks: pendingTasksForAI });
      const enrichedSuggestions = result.prioritizedSuggestions.map(suggestion => {
        const task = tasks.find(t => t.id === suggestion.taskId);
        return {
          ...suggestion,
          description: task ? task.description : "Unknown Task", // Add task description for display
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

  const handleRequestInitialAIAssistance = useCallback(async (taskDescriptionForAI: string) => {
    setAssistingTaskDescription(taskDescriptionForAI);
    setIsRequestingInitialAssistance(true);
    setInitialAssistantOutput(null); // Clear previous output
    setIsAssistantModalOpen(true);
    try {
      const result = await getStudentAssistance({ currentInquiry: taskDescriptionForAI });
      setInitialAssistantOutput(result);
    } catch (error) {
      console.error("AI student assistance error:", error);
      toast({
        title: "AI Assistance Failed",
        description: "Could not get AI help for this task at the moment.",
        variant: "destructive",
      });
       setIsAssistantModalOpen(false); // Close modal on error
    } finally {
      setIsRequestingInitialAssistance(false);
    }
  }, [toast]);

  const handleOpenAIAssistantFromSidebar = useCallback(async () => {
    setAssistingTaskDescription("How can I help you today?"); // Generic prompt for sidebar open
    setIsRequestingInitialAssistance(true);
    setInitialAssistantOutput(null);
    setIsAssistantModalOpen(true);
    try {
      // For a general opening from sidebar, we can directly provide a generic first response or let the AI generate one.
      // Here, we are fetching an AI response to "How can I help you today?"
      const result = await getStudentAssistance({ currentInquiry: "How can I help you today?" });
      setInitialAssistantOutput(result);
    } catch (error) {
      console.error("AI student assistance error:", error);
      toast({
        title: "AI Assistance Failed",
        description: "Could not get AI help at the moment.",
        variant: "destructive",
      });
       setIsAssistantModalOpen(false);
    } finally {
      setIsRequestingInitialAssistance(false);
    }
  }, [toast]);


  if (!isMounted) {
    // Improved Skeleton Loader
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header onAddTask={() => {}} />
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Skeleton - simplified as AppSidebar handles its own initial placeholder */}
          <div className="hidden md:block h-svh bg-muted animate-pulse w-[var(--sidebar-width-icon)]" />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="container mx-auto w-full">
              {/* Filter Controls Skeleton */}
              <div className="h-10 bg-muted rounded-lg w-full sm:w-3/4 md:w-1/2 mb-6 animate-pulse"></div>
              {/* Task List Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[180px] bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onAddTask={handleOpenAddForm} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          tasks={tasks}
          onSuggestPriorities={handleSuggestPriorities}
          isPrioritizing={isSuggestingPriorities}
          onOpenAIAssistant={handleOpenAIAssistantFromSidebar}
        />
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
              onRequestAIAssistance={(task) => handleRequestInitialAIAssistance(task.description)}
              onToggleSubtask={handleToggleSubtaskComplete}
            />
          </div>
        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingTask(null); // Reset editingTask when form is closed
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

      <StudentAssistantModal
        isOpen={isAssistantModalOpen}
        onClose={() => {
          setIsAssistantModalOpen(false);
          setInitialAssistantOutput(null); // Clear initial assistance when closing
          setAssistingTaskDescription(null); // Reset this on close
        }}
        initialAssistance={initialAssistantOutput}
        isLoadingInitial={isRequestingInitialAssistance}
        taskDescription={assistingTaskDescription} // Pass the task description for context
      />
    </div>
  );
}
