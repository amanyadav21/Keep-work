
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar'; // Needed for layout context
import { TaskList } from '@/components/TaskList';
import type { Task, TaskFilter, TaskPriority } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BellRing, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation'; // For back button
import { parseISO, isValid, formatISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm'; // For editing tasks
import { Dialog, DialogContent, DialogHeader, DialogTitle as SrDialogTitle } from '@/components/ui/dialog'; // Renamed to avoid conflict
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDesc, AlertDialogFooter, AlertDialogHeader as SrAlertDialogHeader, AlertDialogTitle as SrAlertDialogTitle } from "@/components/ui/alert-dialog"; // Renamed to avoid conflict

const priorityOrder: Record<TaskPriority, number> = {
  "Urgent": 0,
  "High": 1,
  "Medium": 2,
  "Low": 3,
  "None": 4,
};


export default function RemindersPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [reminders, setReminders] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // For Edit/Delete functionality copied from HomePage
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
   // Add a dummy filter state for AppSidebar prop
  const [currentFilter, setCurrentFilter] = useState<TaskFilter>('all');


  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !authLoading && !user) {
      router.push('/login');
    }
  }, [isMounted, authLoading, user, router]);

  useEffect(() => {
    if (!isMounted || authLoading || !user) {
        if (!user && !authLoading && isMounted) setIsLoading(false);
        else if (authLoading) setIsLoading(true);
      return;
    }

    setIsLoading(true);
    const tasksCollectionRef = collection(db, `users/${user.uid}/tasks`);
    const q = query(
      tasksCollectionRef,
      where("isTrashed", "==", false),
      where("reminderAt", "!=", null), // Only tasks with reminders
      orderBy("reminderAt", "asc")    // Order by reminder time
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        // Consistent date parsing as in HomePage
        let dueDate = data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : (typeof data.dueDate === 'string' && isValid(parseISO(data.dueDate))) ? data.dueDate : null;
        let createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' && isValid(parseISO(data.createdAt))) ? data.createdAt : new Date().toISOString();
        let trashedAt = data.trashedAt instanceof Timestamp ? data.trashedAt.toDate().toISOString() : (typeof data.trashedAt === 'string' && isValid(parseISO(data.trashedAt))) ? data.trashedAt : null;
        let reminderAt = data.reminderAt instanceof Timestamp ? data.reminderAt.toDate().toISOString() : (typeof data.reminderAt === 'string' && isValid(parseISO(data.reminderAt))) ? data.reminderAt : null;

        return {
          id: docSnap.id,
          title: data.title || '',
          description: data.description,
          dueDate,
          category: data.category,
          priority: data.priority || "None",
          isCompleted: data.isCompleted,
          createdAt,
          reminderAt,
          isTrashed: data.isTrashed || false,
          trashedAt,
          subtasks: data.subtasks || [],
          labelId: data.labelId || null,
        } as Task;
      });
      setReminders(tasksData);
      setIsLoading(false);
    }, (error: FirestoreError) => {
      console.error("Error fetching reminders:", error);
      let title = "Error Fetching Reminders";
      let description = "Could not fetch tasks with reminders. " + error.message;

      if (error.code === 'unavailable') {
        title = "You are Offline";
        description = "Reminders could not be loaded. Displaying cached data if available.";
      } else if (error.message && error.message.toLowerCase().includes("missing or insufficient permissions")) {
          title = "Permissions Error";
          description = "You don't have permission to access these reminders.";
      } else if (error.message && error.message.toLowerCase().includes("query requires an index")) {
           title = "Database Index Required";
           description = "A Firestore index is needed for reminders. Please create: isTrashed (ASC), reminderAt (ASC), reminderAt (ASC). Check console for a link.";
      }
      toast({ title, description, variant: "destructive", duration: 15000 });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, isMounted, router, toast]);

  // --- Edit/Delete/ToggleComplete Callbacks (adapted from HomePage) ---
  const handleOpenEditForm = useCallback((task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }, []);

  const handleEditTask = useCallback(async (data: TaskFormValues & { reminderAt?: string | null }, taskId: string) => {
    if (!user) return;
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      await updateDoc(taskDocRef, {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? formatISO(data.dueDate) : null, 
        category: data.category,
        priority: data.priority || "None",
        reminderAt: data.reminderAt || null,
        subtasks: data.subtasks?.map(st => ({ id: st.id || crypto.randomUUID(), text: st.text, isCompleted: st.isCompleted || false })) || [],
        labelId: data.labelId || null,
      });
      setEditingTask(null);
      setIsFormOpen(false);
      toast({ title: "Task Updated" });
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({ title: "Error Updating Task", description: error.message, variant: "destructive" });
    }
  }, [user, toast]);
  
  const handleSubmitTask = useCallback((data: TaskFormValues & { reminderAt?: string | null }, existingTaskId?: string) => {
    if (existingTaskId) { // Only editing is relevant on this page
      handleEditTask(data, existingTaskId);
    }
    // No adding new tasks from reminder page directly.
  }, [handleEditTask]);


  const handleToggleComplete = useCallback(async (id: string) => {
    if (!user) return;
    const task = reminders.find(t => t.id === id);
    if (!task) return;
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, id);
      await updateDoc(taskDocRef, { isCompleted: !task.isCompleted });
    } catch (error: any) {
      console.error("Error toggling task complete:", error);
      toast({ title: "Error", description: `Could not update task status: ${error.message}`, variant: "destructive" });
    }
  }, [user, reminders, toast]);

  const handleToggleSubtaskComplete = useCallback(async (taskId: string, subtaskId: string) => {
    if (!user) return;
    const task = reminders.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      await updateDoc(taskDocRef, { subtasks: updatedSubtasks });
    } catch (error: any)
     {
      console.error("Error toggling subtask complete:", error);
      toast({ title: "Error", description: `Could not update subtask status: ${error.message}`, variant: "destructive" });
    }
  }, [user, reminders, toast]);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (!user) return;
    const task = reminders.find(t => t.id === id);
    if (!task) return;
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, id);
      await updateDoc(taskDocRef, { isTrashed: true, trashedAt: serverTimestamp() });
      toast({ title: "Task Moved to Trash" });
      setTaskToDelete(null);
    } catch (error: any) {
      console.error("Error moving task to trash:", error);
      toast({ title: "Error", description: `Could not move task to trash: ${error.message}`, variant: "destructive" });
      setTaskToDelete(null);
    }
  }, [user, reminders, toast]);
  // --- End Callbacks ---


  if (authLoading || !isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirecting to login...</p>
      </div>
    );
  }
  
  const sortedReminders = [...reminders].sort((a, b) => {
      // Sort by completion status first (pending reminders on top)
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // Then sort by reminderAt (earliest first)
      const reminderA = a.reminderAt ? parseISO(a.reminderAt).getTime() : Number.MAX_SAFE_INTEGER;
      const reminderB = b.reminderAt ? parseISO(b.reminderAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (reminderA !== reminderB) {
        return reminderA - reminderB;
      }
      // Fallback to priority and then due date if reminders are at the exact same time
      const priorityAVal = priorityOrder[a.priority || "None"];
      const priorityBVal = priorityOrder[b.priority || "None"];
      if (priorityAVal !== priorityBVal) {
        return priorityAVal - priorityBVal;
      }
      const dueDateA = a.dueDate ? parseISO(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dueDateB = b.dueDate ? parseISO(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return dueDateA - dueDateB;
    });


  return (
    <>
      <AppSidebar 
        onAddTask={() => { /* No new tasks from here */ }} 
        currentFilter={currentFilter} 
        onFilterChange={() => {}} 
        selectedLabelId={null} 
        onLabelSelect={() => {}} 
      />
      <Header />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold text-foreground flex items-center">
              <BellRing className="mr-2 h-6 w-6 text-primary" />
              Reminders
            </h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow-sm border p-4 animate-pulse h-[180px] space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full mt-1"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/4 mt-auto"></div>
                </div>
              ))}
            </div>
          ) : reminders.length === 0 ? (
             <div className="text-center py-16">
                <BellRing className="mx-auto h-16 w-16 text-muted-foreground/40 mb-4" strokeWidth={1} />
                <h3 className="text-xl font-semibold text-foreground mb-1">No upcoming reminders</h3>
                <p className="text-md text-muted-foreground">Tasks with reminders will appear here.</p>
            </div>
          ) : (
            <TaskList
              tasks={sortedReminders}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEditForm}
              onDelete={(id) => setTaskToDelete(id)}
              onToggleSubtask={handleToggleSubtaskComplete}
            />
          )}
        </div>
      </main>
      
      {/* Dialogs for Edit/Delete (copied from HomePage) */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingTask(null);
      }}>
        <DialogContent className="p-0 sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-card">
          <DialogHeader>
            <SrDialogTitle className="sr-only">Edit Task</SrDialogTitle>
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
          <SrAlertDialogHeader>
            <SrAlertDialogTitle>Move Task to Trash?</SrAlertDialogTitle>
            <AlertDialogDesc>
              This will move the task "{(reminders.find(t => t.id === taskToDelete)?.title || reminders.find(t => t.id === taskToDelete)?.description)?.substring(0, 50)}..." to the trash. You can restore it later from the Trash section.
            </AlertDialogDesc>
          </SrAlertDialogHeader>
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

