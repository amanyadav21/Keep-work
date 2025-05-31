
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import type { Task, TaskFilter } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatISO, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Brain, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, addDoc, doc, updateDoc, query, orderBy, onSnapshot, where, Timestamp, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LandingPage } from '@/components/LandingPage'; // Import the LandingPage component


interface HomePageProps {
  params: Record<string, never>;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function HomePage({ params, searchParams }: HomePageProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user && isMounted) {
      setIsLoadingTasks(true);
      const tasksCollectionRef = collection(db, `users/${user.uid}/tasks`);
      const q = query(tasksCollectionRef, where("isTrashed", "==", false), orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksData = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();

          let dueDate;
          if (data.dueDate instanceof Timestamp) {
            dueDate = data.dueDate.toDate().toISOString();
          } else if (typeof data.dueDate === 'string' && isValid(parseISO(data.dueDate))) {
            dueDate = data.dueDate;
          } else {
            dueDate = new Date().toISOString(); 
          }

          let createdAt;
          if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string' && isValid(parseISO(data.createdAt))) {
            createdAt = data.createdAt;
          } else {
            createdAt = new Date().toISOString(); 
          }
          
          let trashedAt = null;
          if (data.trashedAt instanceof Timestamp) {
            trashedAt = data.trashedAt.toDate().toISOString();
          } else if (typeof data.trashedAt === 'string' && isValid(parseISO(data.trashedAt))) {
            trashedAt = data.trashedAt;
          }

          return {
            id: docSnap.id,
            ...data,
            dueDate,
            createdAt,
            isTrashed: data.isTrashed || false,
            trashedAt,
            subtasks: data.subtasks || [],
          } as Task;
        });
        setTasks(tasksData);
        setIsLoadingTasks(false);
      }, (error) => {
        console.error("Error fetching tasks:", error);
        let description = "Could not fetch tasks. " + error.message;
        if (error.message && error.message.toLowerCase().includes("missing or insufficient permissions")) {
          description = "You don't have permission to access these tasks. Check Firestore rules.";
        } else if (error.message && (error.message.toLowerCase().includes("query requires an index") || error.message.toLowerCase().includes("index needed"))) {
           description = "A Firestore index is needed for fetching tasks. Please create an index for collection group 'tasks' with: isTrashed (ASC), createdAt (DESC). Check server console for a link if provided by Firebase.";
        }
        toast({
            title: "Error Fetching Tasks",
            description: description,
            variant: "destructive",
            duration: 15000,
        });
        setIsLoadingTasks(false);
      });

      return () => unsubscribe();
    } else if (!user && isMounted && !authLoading) {
      setTasks([]); // Clear tasks if user logs out or is not authenticated
      setIsLoadingTasks(false);
    }
  }, [user, toast, isMounted, authLoading]);


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
        createdAt: serverTimestamp(),
        subtasks: data.subtasks?.map(st => ({
          id: st.id || crypto.randomUUID(),
          text: st.text,
          isCompleted: st.isCompleted || false,
        })) || [],
        userId: user.uid,
        isTrashed: false,
        trashedAt: null,
      };
      await addDoc(tasksCollectionRef, newTaskData);
      // Toast moved to TaskForm
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast({ title: "Error", description: `Could not add task: ${error.message}`, variant: "destructive" });
    }
  }, [user, toast]);

  const handleEditTask = useCallback(async (data: TaskFormValues, taskId: string) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "Please log in to edit tasks.", variant: "destructive" });
      return;
    }
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      const updatedTaskData: Partial<Task> = {
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
      // Toast moved to TaskForm
      setEditingTask(null);
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: `Could not update task: ${error.message}`, variant: "destructive" });
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
    } catch (error: any) {
      console.error("Error toggling task complete:", error);
      toast({ title: "Error", description: `Could not update task status: ${error.message}`, variant: "destructive" });
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
    } catch (error: any) {
      console.error("Error toggling subtask complete:", error);
      toast({ title: "Error", description: `Could not update subtask status: ${error.message}`, variant: "destructive" });
    }
  }, [user, tasks, toast]);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, id);
      await updateDoc(taskDocRef, {
        isTrashed: true,
        trashedAt: serverTimestamp()
      });
      toast({ title: "Task Moved to Trash", description: `"${task.description.substring(0,25)}..." moved to trash.` });
      setTaskToDelete(null);
    } catch (error: any) {
      console.error("Error moving task to trash:", error);
      toast({ title: "Error", description: `Could not move task to trash: ${error.message}`, variant: "destructive" });
      setTaskToDelete(null);
    }
  }, [user, tasks, toast]);


  const handleOpenEditForm = useCallback((task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }, []);

  const handleOpenAddForm = useCallback(() => {
    if (!user) {
      // This case should ideally not be reached if the button isn't shown to unauth users,
      // but as a safeguard:
      toast({ title: "Please Log In", description: "You need to be logged in to add tasks.", variant: "default" });
      return;
    }
    setEditingTask(null);
    setIsFormOpen(true);
  }, [user, toast]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      const dueDateA = a.dueDate ? parseISO(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dueDateB = b.dueDate ? parseISO(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (dueDateA !== dueDateB) {
        return dueDateA - dueDateB;
      }
      const createdAtA = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
      const createdAtB = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
      return createdAtA - createdAtB; 
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const nonTrashedTasks = sortedTasks.filter(task => !task.isTrashed);
    switch (filter) {
      case 'pending':
        return nonTrashedTasks.filter(task => !task.isCompleted);
      case 'completed':
        return nonTrashedTasks.filter(task => task.isCompleted);
      default: // 'all'
        return nonTrashedTasks;
    }
  }, [sortedTasks, filter]);

  const pendingTasksCount = useMemo(() => tasks.filter(t => !t.isCompleted && !t.isTrashed).length, [tasks]);


  if (authLoading || !isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) { // Render LandingPage if user is not authenticated
    return <LandingPage />; // LandingPage now includes its own header
  }

  // Authenticated user view
  return (
    <>
      <AppSidebar onAddTask={handleOpenAddForm} currentFilter={filter} onFilterChange={setFilter} />
      <Header onAddTask={handleOpenAddForm} /> {/* Header for authenticated users */}
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-6 max-w-2xl mx-auto">
            <Button
              variant="outline"
              className="w-full h-12 px-4 py-3 text-base text-muted-foreground hover:text-foreground border-dashed hover:border-primary hover:bg-primary/5 justify-start shadow-sm hover:shadow-lg rounded-lg transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={handleOpenAddForm}
            >
              <Plus className="mr-3 h-5 w-5" />
              Take a note...
            </Button>
          </div>
          
          {isLoadingTasks ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow-sm border p-4 animate-pulse h-[180px] space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/4 mt-auto"></div>
                </div>
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

      {/* Dialogs and Tooltips for authenticated users */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingTask(null);
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto rounded-lg bg-card">
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
        <AlertDialogContent className="rounded-lg bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Move Task to Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the task "{tasks.find(t => t.id === taskToDelete)?.description.substring(0, 50)}..." to the trash. You can restore it later from the Trash section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => taskToDelete && handleDeleteTask(taskToDelete)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="lg" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30 p-0 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/ai-assistant" aria-label="Open AI Assistant">
                <Brain className="h-6 w-6" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
