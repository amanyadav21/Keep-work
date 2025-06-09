
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskFilter } from '@/types'; // Added TaskFilter
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, Timestamp, writeBatch, FirestoreError } from 'firebase/firestore';
import { ArrowLeft, Undo, Trash2, Inbox, Loader2, Flag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/AppSidebar'; // Added AppSidebar import
import { Header } from '@/components/Header'; // Added Header import

export default function TrashPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [trashedTasks, setTrashedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
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
      if (!user && !authLoading && isMounted) {
        // This case is handled by the redirect useEffect above
        setIsLoading(false); // Prevent further processing if redirecting
      } else if (authLoading) {
        setIsLoading(true);
      }
      return;
    }

    setIsLoading(true);
    const tasksCollectionRef = collection(db, `users/${user.uid}/tasks`);
    const q = query(tasksCollectionRef, where("isTrashed", "==", true), orderBy("trashedAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();

        let dueDate;
        if (data.dueDate instanceof Timestamp) {
          dueDate = data.dueDate.toDate().toISOString();
        } else if (typeof data.dueDate === 'string' && isValid(parseISO(data.dueDate))) {
          dueDate = data.dueDate;
        } else {
          // Fallback or handle as appropriate for your app, e.g., set to null or a default date
          dueDate = new Date().toISOString(); // Example fallback
        }

        let createdAt;
        if (data.createdAt instanceof Timestamp) {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string' && isValid(parseISO(data.createdAt))) {
          createdAt = data.createdAt;
        } else {
          createdAt = new Date().toISOString(); // Example fallback
        }

        let trashedAt;
        if (data.trashedAt instanceof Timestamp) {
          trashedAt = data.trashedAt.toDate().toISOString();
        } else if (typeof data.trashedAt === 'string' && isValid(parseISO(data.trashedAt))) {
          trashedAt = data.trashedAt;
        } else {
           trashedAt = new Date().toISOString(); // Fallback if not a valid ISO string or Timestamp
        }


        return {
          id: docSnap.id,
          title: data.title || '',
          description: data.description,
          dueDate,
          category: data.category,
          priority: data.priority || 'None',
          isCompleted: data.isCompleted,
          createdAt,
          isTrashed: data.isTrashed,
          trashedAt,
          subtasks: data.subtasks || [],
          labelId: data.labelId || null,
        } as Task;
      });
      setTrashedTasks(tasksData);
      setIsLoading(false);
    }, (error: FirestoreError) => {
      console.error("Error fetching trashed tasks:", error);
      let title = "Error Fetching Trashed Tasks";
      let description = "Could not fetch trashed tasks. " + error.message;

      if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        title = "You are Offline";
        description = "Trashed tasks could not be loaded from the server. Displaying cached data if available.";
      } else if (error.message && error.message.toLowerCase().includes("missing or insufficient permissions")) {
          title = "Permissions Error";
          description = "You don't have permission to access these tasks. Check Firestore rules.";
      } else if (error.message && error.message.toLowerCase().includes("query requires an index")) {
           title = "Database Index Required";
           description = "A Firestore index is needed for the trash page. Please create an index for 'tasks' with: isTrashed (ASC), trashedAt (DESC). Check console for a link to create it.";
      }
      toast({
        title: title,
        description: description,
        variant: "destructive",
        duration: error.code === 'unavailable' ? 8000 : 15000,
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, isMounted, router, toast]);

  const handleRestoreTask = useCallback(async (taskId: string) => {
    if (!user) return;
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      await updateDoc(taskDocRef, {
        isTrashed: false,
        trashedAt: null
      });
      toast({ title: "Task Restored", description: "The task has been moved back to your active list." });
    } catch (error: any) {
      console.error("Error restoring task:", error);
      let description = `Could not restore task: ${error.message}`;
      if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        description = "You appear to be offline. The change will be synced when you're back online.";
        toast({ title: "Offline Mode", description, variant: "default" });
      } else {
        toast({ title: "Error Restoring Task", description, variant: "destructive" });
      }
    }
  }, [user, toast]);

  const handleDeletePermanently = useCallback(async (taskId: string) => {
    if (!user) return;
    try {
      const taskDocRef = doc(db, `users/${user.uid}/tasks`, taskId);
      await deleteDoc(taskDocRef);
      toast({ title: "Task Deleted Permanently", description: "The task has been permanently removed." });
    } catch (error: any) {
      console.error("Error deleting task permanently:", error);
      let description = `Could not delete task permanently: ${error.message}`;
       if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        description = "You appear to be offline. The deletion will be synced when you're back online.";
        toast({ title: "Offline Mode", description, variant: "default" });
      } else {
        toast({ title: "Error Deleting Task", description, variant: "destructive" });
      }
    }
  }, [user, toast]);

  const handleEmptyTrash = useCallback(async () => {
    if (!user || trashedTasks.length === 0) return;
    try {
      const batch = writeBatch(db);
      trashedTasks.forEach(task => {
        const taskDocRef = doc(db, `users/${user.uid}/tasks`, task.id);
        batch.delete(taskDocRef);
      });
      await batch.commit();
      toast({ title: "Trash Emptied", description: "All tasks in the trash have been permanently deleted." });
    } catch (error: any) {
      console.error("Error emptying trash:", error);
      let description = `Could not empty trash: ${error.message}`;
       if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        description = "You appear to be offline. The deletion will be synced when you're back online.";
        toast({ title: "Offline Mode", description, variant: "default" });
      } else {
        toast({ title: "Error Emptying Trash", description, variant: "destructive" });
      }
    }
  }, [user, trashedTasks, toast]);

  if (authLoading || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <AppSidebar 
        onAddTask={() => {}} 
        currentFilter={currentFilter} 
        onFilterChange={() => {}} 
        selectedLabelId={null}
        onLabelSelect={() => {}}
      />
      <Header />
      <div className="flex flex-col min-h-screen bg-muted/30">
        <header className="py-4 px-4 md:px-6 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight flex items-center">
                <Trash2 className="h-6 w-6 mr-2 text-destructive" />
                Trash
              </h1>
            </div>
            {trashedTasks.length > 0 && !isLoading && ( 
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">Empty Trash</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to empty the trash?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is permanent and cannot be undone. All {trashedTasks.length} task(s) in the trash will be deleted forever.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive hover:bg-destructive/90">Yes, Empty Trash</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            {isLoading ? ( 
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card p-4 rounded-lg shadow animate-pulse">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                    <div className="flex justify-end space-x-2">
                      <div className="h-8 w-20 bg-muted rounded"></div>
                      <div className="h-8 w-20 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : trashedTasks.length === 0 ? (
              <div className="text-center py-16">
                <Inbox className="mx-auto h-16 w-16 text-muted-foreground/40 mb-4" strokeWidth={1} />
                <h3 className="text-xl font-semibold text-foreground mb-1">Trash is empty</h3>
                <p className="text-md text-muted-foreground">Deleted tasks will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trashedTasks.map((task) => (
                  <div key={task.id} className="bg-card p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {task.priority && task.priority !== "None" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Flag
                                  className={cn(
                                    "h-4 w-4",
                                    task.priority === "High" && "text-destructive",
                                    task.priority === "Medium" && "text-accent",
                                    task.priority === "Low" && "text-primary"
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{task.priority} Priority</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                         <p className="font-medium text-foreground line-through">{task.title || task.description}</p>
                      </div>
                       {task.title && task.description && (
                          <p className="text-xs text-muted-foreground line-through pl-6">{task.description.substring(0,70)}...</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 pl-6">
                        Trashed {task.trashedAt ? formatDistanceToNow(new Date(task.trashedAt), { addSuffix: true }) : 'some time ago'}
                      </p>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0 self-end sm:self-center">
                      <Button variant="outline" size="sm" onClick={() => handleRestoreTask(task.id)}>
                        <Undo className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task Permanently?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete "{(task.title || task.description).substring(0,50)}..."? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePermanently(task.id)} className="bg-destructive hover:bg-destructive/90">Delete Permanently</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}


    
