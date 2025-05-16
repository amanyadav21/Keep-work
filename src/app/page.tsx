
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
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

  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [prioritySuggestions, setPrioritySuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  const [isSuggestingPriorities, setIsSuggestingPriorities] = useState(false);

  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [initialAssistantOutput, setInitialAssistantOutput] = useState<StudentAssistantOutput | null>(null); 
  const [isRequestingInitialAssistance, setIsRequestingInitialAssistance] = useState(false); 
  const [assistingTaskDescription, setAssistingTaskDescription] = useState<string | null>(null);

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
        variant: "destructive",
      });
    }
  };

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

  const handleSuggestPriorities = async () => {
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
  };

  const handleRequestInitialAIAssistance = async (task: Task) => {
    setAssistingTaskDescription(task.description);
    setIsRequestingInitialAssistance(true);
    setInitialAssistantOutput(null); 
    setIsAssistantModalOpen(true);
    try {
      const result = await getStudentAssistance({ currentInquiry: task.description });
      setInitialAssistantOutput(result);
    } catch (error) {
      console.error("AI student assistance error:", error);
      toast({
        title: "AI Assistance Failed",
        description: "Could not get AI help for this task at the moment.",
        variant: "destructive",
      });
       setIsAssistantModalOpen(false); 
    } finally {
      setIsRequestingInitialAssistance(false);
    }
  };


  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header onAddTask={() => {}} />
        <div className="flex flex-1 overflow-hidden">
          {/* Placeholder for Sidebar - consistent with AppSidebar's desktop placeholder */}
          <div className="hidden md:block h-svh w-16 md:w-[var(--sidebar-width-icon)] lg:w-[var(--sidebar-width)] bg-muted animate-pulse" />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="h-10 bg-muted-foreground/20 rounded-lg w-full sm:w-1/2 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 bg-muted-foreground/20 rounded-lg animate-pulse"></div> 
              ))}
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
        />
        <main className="flex-1 overflow-y-auto container mx-auto px-4 md:px-6 pt-4 pb-6">
          <div className="mb-6">
              <FilterControls currentFilter={filter} onFilterChange={setFilter} />
          </div>
          
          <TaskList
            tasks={filteredTasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleOpenEditForm}
            onDelete={(id) => setTaskToDelete(id)}
            onRequestAIAssistance={handleRequestInitialAIAssistance}
          />
        </main>
      </div>

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

      <StudentAssistantModal
        isOpen={isAssistantModalOpen}
        onClose={() => {
          setIsAssistantModalOpen(false);
          setInitialAssistantOutput(null); 
          setAssistingTaskDescription(null);
        }}
        initialAssistance={initialAssistantOutput}
        isLoadingInitial={isRequestingInitialAssistance}
        taskDescription={assistingTaskDescription}
      />
    </div>
  );
}

    