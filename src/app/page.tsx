
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { FilterControls } from '@/components/FilterControls';
import type { Task, TaskFilter, FirebaseUser } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// import { PrioritySuggestionsModal } from '@/components/PrioritySuggestionsModal'; // AI feature removed
// import { AppSidebar } from '@/components/AppSidebar'; // Sidebar concept changed
import { formatISO, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
// import { suggestTaskPriorities, type FlowTaskInput } from '@/ai/flows/prioritize-tasks-flow'; // AI feature removed
import { Button } from '@/components/ui/button';
import { MessageSquareText, Search, Loader2, Brain, LayoutGrid, AlignLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import { AppSidebar } from '@/components/AppSidebar';

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

  // Priority suggestions state removed
  // const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  // const [prioritySuggestions, setPrioritySuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  // const [isSuggestingPriorities, setIsSuggestingPriorities] = useState(false);

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
        const tasksData = querySnapshot.docs.map(doc => {
          const data = doc.data();

          let dueDate = data.dueDate;
          if (data.dueDate instanceof Timestamp) {
            dueDate = data.dueDate.toDate().toISOString();
          } else if (typeof data.dueDate === 'string' && !isValid(parseISO(data.dueDate))) {
            console.warn(`Invalid dueDate found for task ${doc.id}: ${data.dueDate}. Defaulting to now.`);
            dueDate = new Date().toISOString();
          } else if (!data.dueDate) {
            console.warn(`Missing dueDate for task ${doc.id}. Defaulting to now.`);
            dueDate = new Date().toISOString();
          }

          let createdAt = data.createdAt;
          if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string' && !isValid(parseISO(data.createdAt))) {
             console.warn(`Invalid createdAt found for task ${doc.id}: ${data.createdAt}. Defaulting to now.`);
            createdAt = new Date().toISOString();
          } else if (!data.createdAt) {
            console.warn(`Missing createdAt for task ${doc.id}. Defaulting to now.`);
            createdAt = new Date().toISOString();
          }

          return {
            id: doc.id,
            ...data,
            dueDate,
            createdAt,
            isTrashed: data.isTrashed || false,
            trashedAt: data.trashedAt instanceof Timestamp ? data.trashedAt.toDate().toISOString() : (data.trashedAt || null),
          } as Task;
        });
        setTasks(tasksData);
        setIsLoadingTasks(false);
      }, (error) => {
        console.error("Error fetching tasks:", error);
        if (error.message && error.message.toLowerCase().includes("missing or insufficient permissions")) {
          toast({
            title: "Permissions Error",
            description: "You don't have permission to access these tasks. Check Firestore rules.",
            variant: "destructive",
            duration: 10000,
          });
        } else if (error.message && (error.message.toLowerCase().includes("query requires an index") || error.message.toLowerCase().includes("index needed"))) {
           toast({
            title: "Firestore Index Required",
            description: "A Firestore index is needed for fetching tasks. Please create an index on 'tasks' (collection group) with: isTrashed (ASC), createdAt (DESC). Check console for a link to create it if provided by Firebase.",
            variant: "destructive",
            duration: 15000,
          });
        } else {
          toast({ title: "Error Fetching Tasks", description: "Could not fetch tasks. " + error.message, variant: "destructive" });
        }
        setIsLoadingTasks(false);
      });

      return () => unsubscribe();
    } else if (!user && isMounted && !authLoading) {
      setTasks([]);
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
      toast({ title: "Task Added", description: `"${data.description.substring(0,25)}..." added.`});
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
      toast({ title: "Task Updated", description: `"${data.description.substring(0,25)}..." updated.`});
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

  const handleMoveToTrash = useCallback(async (id: string) => {
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
      toast({ title: "Please Log In", description: "You need to be logged in to add tasks.", variant: "default" });
      return;
    }
    setEditingTask(null);
    setIsFormOpen(true);
  }, [user, toast]);

  // const handleSuggestPriorities = useCallback(async () => { // AI feature removed
  //   if (!user) return;
  //   const pendingTasks = tasks.filter(task => !task.isCompleted && !task.isTrashed);
  //   if (pendingTasks.length === 0) {
  //     toast({ title: "No Pending Tasks", description: "There are no pending tasks to prioritize." });
  //     return;
  //   }
  //   // setIsSuggestingPriorities(true);
  //   // setIsPriorityModalOpen(true);
  //   // setPrioritySuggestions([]); // Clear previous suggestions

  //   try {
  //     // const flowTasks: FlowTaskInput[] = pendingTasks.map(task => ({
  //     //   id: task.id,
  //     //   description: task.description,
  //     //   dueDate: task.dueDate,
  //     //   category: task.category,
  //     // }));
  //     // const result = await suggestTaskPriorities({ tasks: flowTasks });
  //     // const suggestionsWithDesc = result.prioritizedSuggestions.map(s => ({
  //     //   ...s,
  //     //   description: pendingTasks.find(pt => pt.id === s.taskId)?.description || 'Unknown Task',
  //     // }));
  //     // setPrioritySuggestions(suggestionsWithDesc);
  //     toast({ title: "AI Feature Note", description: "AI task prioritization is currently unavailable.", variant: "default"});

  //   } catch (error: any) {
  //     console.error("Error suggesting task priorities:", error);
  //     toast({ title: "Error", description: `Could not suggest priorities: ${error.message}`, variant: "destructive" });
  //     // setIsPriorityModalOpen(false);
  //   } finally {
  //     // setIsSuggestingPriorities(false);
  //   }
  // }, [user, tasks, toast]);


  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      const dueDateA = a.dueDate ? parseISO(a.dueDate).getTime() : 0;
      const dueDateB = b.dueDate ? parseISO(b.dueDate).getTime() : 0;
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
      default:
        return nonTrashedTasks;
    }
  }, [sortedTasks, filter]);


  if (authLoading || !isMounted) {
    return (
       <div className="flex h-screen bg-muted/40 dark:bg-background overflow-hidden">
        <div className="hidden md:block relative w-64 h-svh bg-sidebar-background animate-pulse" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onAddTask={() => {}} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
            <div className="max-w-6xl mx-auto w-full">
              <div className="mb-6 h-10 bg-muted rounded-lg animate-pulse" /> {/* Search Bar Skeleton */}
              <div className="mb-6 h-9 bg-muted rounded-full w-1/2 animate-pulse" /> {/* Filter Controls Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-[220px] bg-card rounded-lg shadow-sm border animate-pulse">
                     <div className="h-32 bg-muted rounded-t-lg"></div>
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/4 mt-auto"></div>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/40 dark:bg-background overflow-hidden">
      {user && <AppSidebar currentFilter={filter} onFilterChange={setFilter} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onAddTask={handleOpenAddForm} />

        {!user ? (
           <main className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-background">
              <MessageSquareText className="h-20 w-20 text-primary/70 mb-6" strokeWidth={1}/>
              <h2 className="text-2xl font-semibold text-foreground mb-3">Welcome to Task Manager!</h2>
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
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
              <div className="max-w-6xl mx-auto w-full">
                <div className="mb-6 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search tasks..."
                    className="w-full pl-10 py-2 text-sm rounded-lg border-border focus:ring-primary focus:border-primary"
                    disabled // Placeholder for now
                  />
                </div>

                <div className="mb-6">
                  <FilterControls currentFilter={filter} onFilterChange={setFilter} />
                </div>

                {isLoadingTasks ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-card rounded-lg shadow-sm border p-0 animate-pulse h-[220px]">
                        <div className="h-32 bg-muted rounded-t-lg"></div>
                        <div className="p-3 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/4 mt-auto"></div>
                        </div>
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
            {/* DashboardSection removed from here, as per new layout */}
          </>
        )}
      </div>

      {user && (
        <>
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
                <AlertDialogTitle>Move Task to Trash?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will move the task "{tasks.find(t => t.id === taskToDelete)?.description.substring(0, 50)}..." to the trash. You can restore it later from the Trash section.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => taskToDelete && handleMoveToTrash(taskToDelete)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Move to Trash
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* PrioritySuggestionsModal removed */}

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
