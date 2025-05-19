
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { FilterControls } from '@/components/FilterControls';
import type { Task, TaskFilter, PrioritizedTaskSuggestion, FirebaseUser } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PrioritySuggestionsModal } from '@/components/PrioritySuggestionsModal';
import { DashboardSection } from '@/components/DashboardSection';
import { formatISO, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskPriorities, type FlowTaskInput } from '@/ai/flows/prioritize-tasks-flow';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, ListFilter, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';

interface HomePageProps {
  params: Record<string, never>;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function HomePage({ params, searchParams = {} }: HomePageProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [prioritySuggestions, setPrioritySuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  const [isSuggestingPriorities, setIsSuggestingPriorities] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Fetch tasks from Firestore
  useEffect(() => {
    if (user) {
      setIsLoadingTasks(true);
      const tasksCollectionRef = collection(db, `users/${user.uid}/tasks`);
      const q = query(tasksCollectionRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Ensure dates are stored as ISO strings if they come from Firestore Timestamps
            dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : data.dueDate,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          } as Task;
        });
        setTasks(tasksData);
        setIsLoadingTasks(false);
      }, (error) => {
        console.error("Error fetching tasks:", error);
        toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
        setIsLoadingTasks(false);
      });

      return () => unsubscribe(); // Cleanup listener on unmount
    } else {
      setTasks([]); // Clear tasks if no user
      setIsLoadingTasks(false);
    }
  }, [user, toast]);


  const handleAddTask = useCallback(async (data: TaskFormValues) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "Please log in to add tasks.", variant: "destructive" });
      return;
    }
    try {
      const tasksCollectionRef = collection(db, `users/${user.uid}/tasks`);
      const newTaskData = {
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
        userId: user.uid, // Store userId for potential wider queries (optional but good practice)
      };
      await addDoc(tasksCollectionRef, newTaskData);
      toast({ title: "Task Added", description: `"${data.description.substring(0,25)}..." added.`});
    } catch (error) {
      console.error("Error adding task:", error);
      toast({ title: "Error", description: "Could not add task.", variant: "destructive" });
    }
  }, [user, toast]);

  const handleEditTask = useCallback(async (data: TaskFormValues, taskId: string) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "Please log in to edit tasks.", variant: "destructive" });
      return;
    }
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      const updatedTaskData = {
        description: data.description,
        dueDate: formatISO(data.dueDate),
        category: data.category,
        subtasks: data.subtasks?.map(st => ({
          id: st.id || crypto.randomUUID(),
          text: st.text,
          isCompleted: st.isCompleted || false,
        })) || [],
      };
      await updateDoc(taskDocRef, updatedTaskData);
      toast({ title: "Task Updated", description: `"${data.description.substring(0,25)}..." updated.`});
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
  }, [user, toast]);

  const handleSubmitTask = useCallback((data: TaskFormValues, existingTaskId?: string) => {
    if (existingTaskId) {
      handleEditTask(data, existingTaskId);
    } else {
      handleAddTask(data);
    }
    setIsFormOpen(false);
  }, [handleAddTask, handleEditTask]);

  const handleToggleComplete = useCallback(async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, id);
      await updateDoc(taskDocRef, { isCompleted: !task.isCompleted });
      // Toast is handled by onSnapshot or can be added here if preferred
      // toast({ title: `Task ${!task.isCompleted ? "Completed" : "Marked Pending"}` });
    } catch (error) {
      console.error("Error toggling task complete:", error);
      toast({ title: "Error", description: "Could not update task status.", variant: "destructive" });
    }
  }, [user, tasks, toast]);

  const handleToggleSubtaskComplete = useCallback(async (taskId: string, subtaskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      await updateDoc(taskDocRef, { subtasks: updatedSubtasks });
    } catch (error) {
      console.error("Error toggling subtask complete:", error);
      toast({ title: "Error", description: "Could not update subtask status.", variant: "destructive" });
    }
  }, [user, tasks, toast]);


  const handleOpenEditForm = useCallback((task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }, []);

  const handleOpenAddForm = useCallback(() => {
    if (!user) {
      toast({ title: "Please Log In", description: "You need to be logged in to add tasks.", variant: "default" });
      // Optionally, redirect to login: router.push('/login');
      return;
    }
    setEditingTask(null);
    setIsFormOpen(true);
  }, [user, toast]);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, id);
      await deleteDoc(taskDocRef);
      toast({ title: "Task Deleted", description: `"${task.description.substring(0,25)}..." deleted.`, variant: "destructive" });
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
      setTaskToDelete(null);
    }
  }, [user, tasks, toast]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      const dueDateA = new Date(a.dueDate).getTime();
      const dueDateB = new Date(b.dueDate).getTime();
      if (dueDateA !== dueDateB) {
        return dueDateA - dueDateB;
      }
      // Ensure createdAt is valid date before parsing for sort
      const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdAtA - createdAtB;
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'pending':
        return sortedTasks.filter(task => !task.isCompleted);
      case 'completed':
        return sortedTasks.filter(task => task.isCompleted);
      default:
        return sortedTasks;
    }
  }, [sortedTasks, filter]);

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

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header onAddTask={() => {}} />
        <main className="flex-1 flex items-center justify-center p-4">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onAddTask={handleOpenAddForm} />
      
      {!user ? (
        <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageCircle className="h-20 w-20 text-muted-foreground mb-6" strokeWidth={1}/>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Welcome to Upnext!</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                Your smart task manager for staying organized and productive. Please log in or sign up to manage your tasks.
            </p>
            <div className="flex gap-4">
                <Button asChild size="lg">
                    <Link href="/login">Log In</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
        </main>
      ) : (
        <>
          <main className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-6">
            <div className="container mx-auto w-full max-w-6xl">
              <div className="mb-6">
                <FilterControls currentFilter={filter} onFilterChange={setFilter} />
              </div>
              {isLoadingTasks ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-[180px] bg-muted rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <TaskList
                  tasks={filteredTasks}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleOpenEditForm}
                  onDelete={(id) => setTaskToDelete(id)}
                  onToggleSubtask={handleToggleSubtaskComplete}
                />
              )}
            </div>
          </main>

          {tasks.length > 0 && (
            <DashboardSection
              tasks={tasks}
              onSuggestPriorities={handleSuggestPriorities}
              isPrioritizing={isSuggestingPriorities}
            />
          )}

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
              <Brain className="h-6 w-6" />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
