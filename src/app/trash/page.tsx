
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Undo, Trash2, Inbox, Loader2, Flag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function TrashPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [trashedTasks, setTrashedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      router.push('/login');
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
        
        let trashedAt;
        if (data.trashedAt instanceof Timestamp) {
          trashedAt = data.trashedAt.toDate().toISOString();
        } else if (typeof data.trashedAt === 'string' && isValid(parseISO(data.trashedAt))) {
          trashedAt = data.trashedAt;
        } else {
          trashedAt = new Date().toISOString(); 
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
        } as Task;
      });
      setTrashedTasks(tasksData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching trashed tasks:", error);
      if (error.message && error.message.toLowerCase().includes("missing or insufficient permissions")) {
          toast({
            title: "Permissions Error",
            description: "You don't have permission to access these tasks. Check Firestore rules.",
            variant: "destructive",
            duration: 10000,
          });
      } else if (error.message && error.message.toLowerCase().includes("query requires an index")) {
           toast({
            title: "Firestore Index Required",
            description: "A Firestore index is needed for the trash page. Please create an index for collection group 'tasks' with: isTrashed (ASC), trashedAt (DESC). Check console for a link to create it.",
            variant: "destructive",
            duration: 15000,
          });
        } else {
        toast({ title: "Error", description: "Could not fetch trashed tasks. " + error.message, variant: "destructive" });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router, toast, isMounted]);

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
      toast({ title: "Error", description: `Could not restore task: ${error.message}`, variant: "destructive" });
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
      toast({ title: "Error", description: `Could not delete task permanently: ${error.message}`, variant: "destructive" });
    }
  }, [user, toast]);

  const handleEmptyTrash = useCallback(async () => {
    if (!user || trashedTasks.length === 0) return;
    try {
      // Consider using a batched write for performance if deleting many tasks
      const batch = writeBatch(db);
      trashedTasks.forEach(task => {
        const taskDocRef = doc(db, `users/${user.uid}/tasks`, task.id);
        batch.delete(taskDocRef);
      });
      await batch.commit();
      toast({ title: "Trash Emptied", description: "All tasks in the trash have been permanently deleted." });
    } catch (error: any) {
      console.error("Error emptying trash:", error);
      toast({ title: "Error", description: `Could not empty trash: ${error.message}`, variant: "destructive" });
    }
  }, [user, trashedTasks, toast]);

  if (authLoading || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !authLoading && isMounted) {
     router.push('/login');
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirecting to login...</p>
      </div>
    );
  }

  return (
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
          {trashedTasks.length > 0 && (
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
                  <div className="h-5 bg-muted rounded w-3/4 mb-2"></div> {/* Title placeholder */}
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
  );
}
