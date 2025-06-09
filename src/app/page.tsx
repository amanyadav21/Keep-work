
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { AppSidebar } from '@/components/AppSidebar';
import { TaskList } from '@/components/TaskList';
import type { Task, TaskFilter, TaskPriority } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle as SrDialogTitle } from '@/components/ui/dialog'; // Renamed to avoid conflict if DialogTitle is used elsewhere
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDesc, AlertDialogFooter, AlertDialogHeader as SrAlertDialogHeader, AlertDialogTitle as SrAlertDialogTitle } from "@/components/ui/alert-dialog"; // Renamed to avoid conflict
import { formatISO, parseISO, isValid, isToday as dateFnsIsToday, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Brain, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, addDoc, doc, updateDoc, query, orderBy, onSnapshot, where, Timestamp, serverTimestamp, writeBatch, getDocs, FirestoreError } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LandingPage } from '@/components/LandingPage';
// AddTaskCard is removed, InteractiveTaskCard will handle its role
import { cn } from '@/lib/utils'; // For conditional styling of centered card

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
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  
  // State for the centered, expanded task card (for editing/viewing)
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);
  const [isExpandedTaskVisible, setIsExpandedTaskVisible] = useState(false);
  
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [initialAddTaskContent, setInitialAddTaskContent] = useState("");


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
            isTrashed: data.isTrashed || false,
            trashedAt,
            reminderAt,
            subtasks: data.subtasks || [],
            labelId: data.labelId || null,
          } as Task;
        });
        setTasks(tasksData);
        setIsLoadingTasks(false);
      }, (error: FirestoreError) => {
        console.error("Error fetching tasks:", error);
        let title = "Error Fetching Tasks";
        let description = "Could not fetch tasks. " + error.message;
        if (error.code === 'unavailable') { title = "You are Offline"; description = "Tasks could not be loaded."; }
        else if (error.message?.toLowerCase().includes("missing or insufficient permissions")) { title = "Permissions Error"; description = "You don't have permission to access these tasks."; }
        else if (error.message?.toLowerCase().includes("query requires an index")) { title = "Database Index Required"; description = "Firestore index needed: isTrashed (ASC), createdAt (DESC)."; }
        toast({ title, description, variant: "destructive", duration: 15000 });
        setIsLoadingTasks(false);
      });
      return () => unsubscribe();
    } else if (!user && isMounted && !authLoading) {
      setTasks([]);
      setIsLoadingTasks(false);
    }
  }, [user, toast, isMounted, authLoading]);

  const handleAddTask = useCallback(async (data: InteractiveTaskCardValues) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "Please log in to add tasks.", variant: "destructive" });
      return;
    }
    try {
      const tasksCollectionRef = collection(db, `users/${user.uid}/tasks`);
      const newTaskData = {
        title: data.title,
        description: data.description,
        dueDate: formatISO(data.dueDate),
        category: data.category,
        priority: data.priority || "None",
        isCompleted: false, // New tasks are not completed
        createdAt: serverTimestamp(),
        subtasks: data.subtasks?.map(st => ({ id: st.id || crypto.randomUUID(), text: st.text, isCompleted: st.isCompleted || false })) || [],
        userId: user.uid,
        isTrashed: false,
        trashedAt: null,
        reminderAt: data.reminderAt ? data.reminderAt : null, // Already formatted ISO string
        labelId: data.labelId || null,
      };
      await addDoc(tasksCollectionRef, newTaskData);
      // Toast is now handled in InteractiveTaskCard onSubmit
    } catch (error: any) {
      console.error("Error adding task:", error);
      let description = `Could not add task: ${error.message}`;
      if (error.code === 'unavailable') { description = "Offline. Task saved locally, will sync."; toast({ title: "Offline Mode", description, variant: "default" }); }
      else { toast({ title: "Error Adding Task", description, variant: "destructive" }); }
    }
  }, [user, toast]);

  const handleEditTask = useCallback(async (data: InteractiveTaskCardValues, taskId: string) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "Please log in to edit tasks.", variant: "destructive" });
      return;
    }
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      const updatedTaskData: Partial<Omit<Task, 'id' | 'createdAt' | 'userId'>> = {
        title: data.title,
        description: data.description,
        dueDate: formatISO(data.dueDate),
        category: data.category,
        priority: data.priority || "None",
        reminderAt: data.reminderAt ? data.reminderAt : null, // Already formatted ISO string
        subtasks: data.subtasks?.map(st => ({ id: st.id || crypto.randomUUID(), text: st.text, isCompleted: st.isCompleted || false })) || [],
        labelId: data.labelId || null,
      };
      await updateDoc(taskDocRef, updatedTaskData);
      // Toast is now handled in InteractiveTaskCard onSubmit
    } catch (error: any) {
      console.error("Error updating task:", error);
      let description = `Could not update task: ${error.message}`;
      if (error.code === 'unavailable') { description = "Offline. Update saved locally, will sync."; toast({ title: "Offline Mode", description, variant: "default" }); }
      else { toast({ title: "Error Updating Task", description, variant: "destructive" }); }
    }
  }, [user, toast]);

  const handleSubmitTask = useCallback((data: InteractiveTaskCardValues & { reminderAt?: string | null }, existingTaskId?: string) => {
    // The reminderAt logic from TaskForm is now integrated into InteractiveTaskCard's onSubmit
    // So data received here should already have reminderAt correctly formatted if set.
    if (existingTaskId) {
      handleEditTask(data, existingTaskId);
    } else {
      handleAddTask(data);
    }
    // Close centered/expanded view if it was open
    setIsExpandedTaskVisible(false);
    setExpandedTask(null);
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
      if (error.code === 'unavailable') { description = "Offline. Change syncs when online."; toast({ title: "Offline Mode", description, variant: "default" }); }
      else { toast({ title: "Error", description, variant: "destructive" }); }
    }
  }, [user, tasks, toast]);

  const handleToggleSubtaskComplete = useCallback(async (taskId: string, subtaskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    const updatedSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st);
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      await updateDoc(taskDocRef, { subtasks: updatedSubtasks });
    } catch (error: any)
     {
      console.error("Error toggling subtask complete:", error);
      let description = `Could not update subtask: ${error.message}`;
       if (error.code === 'unavailable') { description = "Offline. Change syncs when online."; toast({ title: "Offline Mode", description, variant: "default" }); }
      else { toast({ title: "Error", description, variant: "destructive" }); }
    }
  }, [user, tasks, toast]);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, id);
      await updateDoc(taskDocRef, { isTrashed: true, trashedAt: serverTimestamp() });
      toast({ title: "Task Moved to Trash", description: `"${(task.title || task.description)?.substring(0,25)}..." moved.` });
      setTaskToDelete(null);
    } catch (error: any) {
      console.error("Error moving task to trash:", error);
       let description = `Could not move to trash: ${error.message}`;
       if (error.code === 'unavailable') { description = "Offline. Change syncs when online."; toast({ title: "Offline Mode", description, variant: "default" }); }
      else { toast({ title: "Error", description, variant: "destructive" }); }
      setTaskToDelete(null);
    }
  }, [user, tasks, toast]);

  const handleOpenEditView = useCallback((taskToEdit: Task) => {
    setExpandedTask(taskToEdit);
    setIsExpandedTaskVisible(true);
  }, []);
  
  const handleOpenAddFormThroughDialog = useCallback(() => {
    if (!user) {
      toast({ title: "Please Log In", description: "You need to be logged in to add tasks.", variant: "default" });
      return;
    }
    // This function is for the sidebar's "Add Task" button.
    // It should open the centered InteractiveTaskCard in 'add' mode, but with more prominent fields.
    // For simplicity, we can open it in 'edit' mode but without an existing task, which InteractiveTaskCard handles.
    setExpandedTask(null); // No existing task, so it's effectively an "add detailed task"
    setIsExpandedTaskVisible(true);
  }, [user, toast]);

  const handleLabelSelect = useCallback((labelId: string | null) => {
    setSelectedLabelId(labelId);
    if (labelId) { setFilter('general'); }
  }, []);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      if (!a.isCompleted && !b.isCompleted) {
        const priorityA = priorityOrder[a.priority || "None"];
        const priorityB = priorityOrder[b.priority || "None"];
        if (priorityA !== priorityB) return priorityA - priorityB;
      }
      const dueDateA = a.dueDate ? parseISO(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dueDateB = b.dueDate ? parseISO(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (dueDateA !== dueDateB) return dueDateA - dueDateB;
      const createdAtA = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
      const createdAtB = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
      return createdAtA - createdAtB;
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let tasksToFilter = sortedTasks.filter(task => !task.isTrashed);
    if (selectedLabelId) tasksToFilter = tasksToFilter.filter(task => task.labelId === selectedLabelId);
    if (selectedLabelId && (filter === 'general' || filter === 'all')) return tasksToFilter;
    switch (filter) {
      case 'pending': return tasksToFilter.filter(task => !task.isCompleted);
      case 'completed': return tasksToFilter.filter(task => task.isCompleted);
      case 'today':
        return tasksToFilter.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = parseISO(task.dueDate);
          return isValid(dueDate) && dateFnsIsToday(startOfDay(dueDate));
        });
      case 'general': // Now shows all non-trashed tasks
        return nonTrashedTasks;
      default: 
        return nonTrashedTasks;
    }
  }, [sortedTasks, filter, selectedLabelId]);

  if (authLoading || !isMounted) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!user) return <LandingPage />;

  return (
    <>
      <AppSidebar
        currentFilter={filter}
        onFilterChange={setFilter}
        selectedLabelId={selectedLabelId}
        onLabelSelect={handleLabelSelect}
      />
      <Header />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
        <div className="w-full max-w-6xl mx-auto">
          {/* The new InteractiveTaskCard for quick adds */}
          <InteractiveTaskCard
            mode="add"
            onSubmit={handleSubmitTask}
            initialContent={initialAddTaskContent} // Pass any pre-filled content if needed
            className="mb-8" // Add some margin below the add card
          />

          {isLoadingTasks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow-sm border p-4 animate-pulse h-[180px] space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div><div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full mt-1"></div><div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4 mt-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEditView} // This will now open the centered InteractiveTaskCard
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
          <DialogHeader>
            <SrDialogTitle className="sr-only">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </SrDialogTitle>
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
              This will move the task "{(tasks.find(t => t.id === taskToDelete)?.title || tasks.find(t => t.id === taskToDelete)?.description)?.substring(0, 50)}..." to trash.
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

