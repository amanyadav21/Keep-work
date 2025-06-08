
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import type { Task, TaskFilter, TaskPriority } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDesc, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatISO, parseISO, isValid, isToday as dateFnsIsToday, startOfDay, set, getHours, getMinutes, getSeconds, getMilliseconds } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Brain, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, addDoc, doc, updateDoc, query, orderBy, onSnapshot, where, Timestamp, serverTimestamp, writeBatch, getDocs, FirestoreError } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LandingPage } from '@/components/LandingPage';


interface HomePageProps {
  params: Record<string, never>;
  searchParams: { [key: string]: string | string[] | undefined };
}

const priorityOrder: Record<TaskPriority, number> = {
  "Urgent": 0,
  "High": 1,
  "Medium": 2,
  "Low": 3,
  "None": 4,
};

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('general');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [quickAddInput, setQuickAddInput] = useState("");
  const quickAddInputRef = useRef<HTMLInputElement>(null);


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
          
          let reminderAt = null;
          if (data.reminderAt instanceof Timestamp) {
            reminderAt = data.reminderAt.toDate().toISOString();
          } else if (typeof data.reminderAt === 'string' && isValid(parseISO(data.reminderAt))) {
            reminderAt = data.reminderAt;
          }


          return {
            id: docSnap.id,
            title: data.title || '',
            description: data.description,
            dueDate,
            category: data.category,
            priority: data.priority || "None",
            isCompleted: data.isCompleted,
            createdAt,
            isTrashed: data.isTrashed || false,
            trashedAt,
            reminderAt,
            subtasks: data.subtasks || [],
          } as Task;
        });
        setTasks(tasksData);
        setIsLoadingTasks(false);
      }, (error: FirestoreError) => {
        console.error("Error fetching tasks:", error);
        let title = "Error Fetching Tasks";
        let description = "Could not fetch tasks. " + error.message;

        if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
          title = "You are Offline";
          description = "Tasks could not be loaded from the server. Displaying cached data if available. Some functionality may be limited.";
        } else if (error.message && error.message.toLowerCase().includes("missing or insufficient permissions")) {
          title = "Permissions Error";
          description = "You don't have permission to access these tasks. Check Firestore rules.";
        } else if (error.message && (error.message.toLowerCase().includes("query requires an index") || error.message.toLowerCase().includes("index needed"))) {
           title = "Database Index Required";
           description = "A Firestore index is needed for fetching tasks. Please create an index for 'tasks' with: isTrashed (ASC), createdAt (DESC). Check server console for a link if provided by Firebase.";
        }
        toast({
            title: title,
            description: description,
            variant: "destructive",
            duration: error.code === 'unavailable' ? 8000 : 15000,
        });
        setIsLoadingTasks(false); 
      });

      return () => unsubscribe();
    } else if (!user && isMounted && !authLoading) {
      setTasks([]);
      setIsLoadingTasks(false);
    }
  }, [user, toast, isMounted, authLoading]);


  const handleQuickAddTask = useCallback(async () => {
    if (!user || !quickAddInput.trim()) {
      if (!user) toast({ title: "Not Authenticated", description: "Please log in to add tasks.", variant: "destructive" });
      return;
    }
    try {
      const tasksCollectionRef = collection(db, `users/${user.uid}/tasks`);
      const todayEndOfDay = set(new Date(), { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });

      const newTaskData = {
        title: quickAddInput.trim(),
        description: "", // Empty description for quick add
        dueDate: formatISO(todayEndOfDay), // Default due date to today
        category: "Personal" as Task["category"], // Default category
        priority: "None" as Task["priority"], // Default priority
        isCompleted: false,
        createdAt: serverTimestamp(),
        subtasks: [],
        userId: user.uid,
        isTrashed: false,
        trashedAt: null,
      };
      await addDoc(tasksCollectionRef, newTaskData);
      toast({ title: "Task Added", description: `"${quickAddInput.trim().substring(0,30)}..." added quickly.` });
      setQuickAddInput(""); // Clear input after adding
    } catch (error: any) {
      console.error("Error quick adding task:", error);
      toast({ title: "Error", description: `Could not add task: ${error.message}`, variant: "destructive" });
    }
  }, [user, quickAddInput, toast]);

  const handleAddTask = useCallback(async (data: TaskFormValues & { reminderAt?: string | null }) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "Please log in to add tasks.", variant: "destructive" });
      return;
    }
    try {
      const tasksCollectionRef = collection(db, `users/${user.uid}/tasks`);
      const newTaskData = {
        title: data.title,
        description: data.description || "", // Ensure description is always a string
        dueDate: formatISO(data.dueDate),
        category: data.category,
        priority: data.priority || "None",
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
        reminderAt: data.reminderAt || null,
      };
      await addDoc(tasksCollectionRef, newTaskData);
    } catch (error: any) {
      console.error("Error adding task:", error);
      let description = `Could not add task: ${error.message}`;
      if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        description = "You appear to be offline. The task will be saved locally and synced when you're back online.";
         toast({ title: "Offline Mode", description, variant: "default" });
      } else {
        toast({ title: "Error Adding Task", description, variant: "destructive" });
      }
    }
  }, [user, toast]);

  const handleEditTask = useCallback(async (data: TaskFormValues & { reminderAt?: string | null }, taskId: string) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "Please log in to edit tasks.", variant: "destructive" });
      return;
    }
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      const updatedTaskData: Partial<Omit<Task, 'id' | 'createdAt' | 'userId'>> = {
        title: data.title,
        description: data.description || "", // Ensure description is always a string
        dueDate: formatISO(data.dueDate),
        category: data.category,
        priority: data.priority || "None",
        reminderAt: data.reminderAt || null,
        subtasks: data.subtasks?.map(st => ({
          id: st.id || crypto.randomUUID(),
          text: st.text,
          isCompleted: st.isCompleted || false,
        })) || [],
      };
      await updateDoc(taskDocRef, updatedTaskData);
      setEditingTask(null);
    } catch (error: any) {
      console.error("Error updating task:", error);
      let description = `Could not update task: ${error.message}`;
      if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        description = "You appear to be offline. The task update will be saved locally and synced when you're back online.";
        toast({ title: "Offline Mode", description, variant: "default" });
      } else {
        toast({ title: "Error Updating Task", description, variant: "destructive" });
      }
    }
  }, [user, toast]);

  const handleSubmitTask = useCallback((data: TaskFormValues & { reminderAt?: string | null }, existingTaskId?: string) => {
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
      let description = `Could not update task status: ${error.message}`;
      if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        description = "You appear to be offline. The change will be synced when you're back online.";
        toast({ title: "Offline Mode", description, variant: "default" });
      } else {
        toast({ title: "Error", description, variant: "destructive" });
      }
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
      let description = `Could not update subtask status: ${error.message}`;
       if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        description = "You appear to be offline. The change will be synced when you're back online.";
        toast({ title: "Offline Mode", description, variant: "default" });
      } else {
        toast({ title: "Error", description, variant: "destructive" });
      }
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
      toast({ title: "Task Moved to Trash", description: `"${(task.title || task.description).substring(0,25)}..." moved to trash.` });
      setTaskToDelete(null);
    } catch (error: any) {
      console.error("Error moving task to trash:", error);
       let description = `Could not move task to trash: ${error.message}`;
       if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        description = "You appear to be offline. The change will be synced when you're back online.";
        toast({ title: "Offline Mode", description, variant: "default" });
      } else {
        toast({ title: "Error", description, variant: "destructive" });
      }
      setTaskToDelete(null);
    }
  }, [user, tasks, toast]);


  const handleOpenEditForm = useCallback((task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }, []);

  const handleOpenAddForm = useCallback(() => {
    if (!user) {
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
      if (!a.isCompleted && !b.isCompleted) {
        const priorityA = priorityOrder[a.priority || "None"];
        const priorityB = priorityOrder[b.priority || "None"];
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
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
      case 'today':
        return nonTrashedTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = parseISO(task.dueDate);
          return isValid(dueDate) && dateFnsIsToday(startOfDay(dueDate));
        });
      case 'general':
        return nonTrashedTasks.filter(task => task.category === 'General');
      case 'all':
        return nonTrashedTasks;
      default: 
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

  if (!user) {
    return <LandingPage />;
  }

  return (
    <>
      <AppSidebar onAddTask={handleOpenAddForm} currentFilter={filter} onFilterChange={setFilter} />
      <Header />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
        <div className="w-full max-w-3xl mx-auto">
          <div className="mb-6 shadow-lg rounded-lg border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-ring transition-all">
            <Input
              ref={quickAddInputRef}
              type="text"
              placeholder="Take a note..."
              value={quickAddInput}
              onChange={(e) => setQuickAddInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quickAddInput.trim()) {
                  handleQuickAddTask();
                  e.preventDefault(); 
                }
              }}
              className="w-full h-12 px-4 py-3 text-base bg-card text-foreground placeholder:text-muted-foreground border-none focus-visible:ring-0"
            />
          </div>

          {isLoadingTasks ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow-sm border p-4 animate-pulse h-[180px] space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full mt-1"></div> {/* Description line 1 */}
                    <div className="h-4 bg-muted rounded w-1/2"></div> {/* Description line 2 */}
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

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingTask(null);
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto rounded-lg bg-card">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update the details of your existing task.' : 'Fill in the details below to add a new task to your list.'}
            </DialogDescription>
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
            <AlertDialogDesc>
              This will move the task "{(tasks.find(t => t.id === taskToDelete)?.title || tasks.find(t => t.id === taskToDelete)?.description)?.substring(0, 50)}..." to the trash. You can restore it later from the Trash section.
            </AlertDialogDesc>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => taskToDelete && handleDeleteTask(taskToDelete)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

