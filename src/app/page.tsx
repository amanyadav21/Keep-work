
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { FilterControls } from '@/components/FilterControls';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Task, TaskCategory, TaskFilter, PrioritizedTaskSuggestion, StudentAssistantOutput, Subtask } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PrioritySuggestionsModal } from '@/components/PrioritySuggestionsModal';
import { StudentAssistantModal } from '@/components/StudentAssistantModal'; 
import { AppSidebar } from '@/components/AppSidebar'; 
import { formatISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskPriorities, type FlowTaskInput } from '@/ai/flows/prioritize-tasks-flow';
import { getStudentAssistance } from '@/ai/flows/student-assistant-flow';

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

  const handleAddTask = (data: TaskFormValues) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      description: data.description,
      dueDate: formatISO(data.dueDate),
      category: data.category,
      isCompleted: false,
      createdAt: formatISO(new Date()),
      subtasks: data.subtasks?.map(st => ({
        id: st.id || crypto.randomUUID(), // Ensure ID for new subtasks
        text: st.text,
        isCompleted: st.isCompleted || false,
      })) || [],
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleEditTask = (data: TaskFormValues, taskId: string) => {
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
  };

  const handleSubmitTask = (data: TaskFormValues, existingTaskId?: string) => {
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

  const handleToggleSubtaskComplete = (taskId: string, subtaskId: string) => {
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

  const handleRequestInitialAIAssistance = async (taskDescriptionForAI: string) => {
    setAssistingTaskDescription(taskDescriptionForAI);
    setIsRequestingInitialAssistance(true);
    setInitialAssistantOutput(null); 
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
       setIsAssistantModalOpen(false); 
    } finally {
      setIsRequestingInitialAssistance(false);
    }
  };

  const handleOpenAIAssistantFromSidebar = async () => {
    setAssistingTaskDescription("General Inquiry"); 
    setIsRequestingInitialAssistance(true);
    setInitialAssistantOutput(null); 
    setIsAssistantModalOpen(true);
    try {
      // Use a generic prompt for general inquiries
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
  };


  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header onAddTask={() => {}} /> {/* Placeholder onAddTask during skeleton */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Skeleton */}
          <div className="hidden md:block h-svh w-[var(--sidebar-width-icon)] bg-muted animate-pulse" />
          {/* Main Content Skeleton */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="container mx-auto w-full">
              {/* Filter Controls Skeleton */}
              <div className="h-10 bg-muted rounded-lg w-full sm:w-3/4 md:w-1/2 mb-6 animate-pulse"></div>
              {/* Task List Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => ( 
                  <div key={i} className="h-44 bg-muted rounded-lg animate-pulse"></div> 
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
