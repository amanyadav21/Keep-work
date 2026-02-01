"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/AppSidebar';
import { Input } from '@/components/ui/input';
import { TaskList } from '@/components/TaskList';
import type { Task, TaskFilter, TaskPriority } from '@/types';
import { TaskFormValues } from '@/components/TaskForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle as SrDialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDesc, AlertDialogFooter, AlertDialogHeader as SrAlertDialogHeader, AlertDialogTitle as SrAlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatISO, parseISO, isValid, isToday as dateFnsIsToday, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
// Removed useAuth import
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TaskForm } from '@/components/TaskForm';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useSidebar } from '@/components/ui/sidebar';


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
  const { toast } = useToast();
  const { effectiveSidebarWidth } = useSidebar();
  
  // Use Local Storage Hook
  const { tasks, addTask, updateTask, trashTask } = useTaskManager();

  const [filter, setFilter] = useState<TaskFilter>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Simulate loading/settling delay
    const timer = setTimeout(() => {
        setIsLoadingTasks(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddTask = useCallback(async (data: TaskFormValues) => {
    try {
      const newTaskData: Task = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        dueDate: formatISO(data.dueDate),
        category: data.category,
        priority: data.priority || "None",
        isCompleted: false,
        createdAt: new Date().toISOString(),
        subtasks: data.subtasks?.map(st => ({ id: st.id || crypto.randomUUID(), text: st.text, isCompleted: st.isCompleted || false })) || [],
        userId: "local-user",
        isTrashed: false,
        trashedAt: null,
        reminderAt: data.reminderAt || null,
        labelId: data.labelId || null,
      };
      
      addTask(newTaskData);
      
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast({ title: "Error", description: "Could not add task locally.", variant: "destructive" });
    }
  }, [toast, addTask]);

  const handleEditTask = useCallback(async (data: TaskFormValues, taskId: string) => {
    try {
      const updatedTaskData: Partial<Task> = {
        title: data.title,
        description: data.description,
        dueDate: formatISO(data.dueDate),
        category: data.category,
        priority: data.priority || "None",
        reminderAt: data.reminderAt || null,
        subtasks: data.subtasks?.map(st => ({
          id: st.id || crypto.randomUUID(),
          text: st.text,
          isCompleted: st.isCompleted || false,
        })) || [],
        labelId: data.labelId || null, 
      };
      updateTask(taskId, updatedTaskData);
      toast({ title: "Task Updated", description: "Changes saved to local storage." });
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
  }, [updateTask, toast]);

  // ... (rest of handlers like handleSubmitTask, etc. need no auth changes but I need to include them to keep file valid if I am replacing block)
  // Actually, I can rely on previous code if I target carefully, but here I am replacing START of component.
  
  const handleSubmitTask = useCallback((data: TaskFormValues, existingTaskId?: string) => {
    if (existingTaskId) {
      handleEditTask(data, existingTaskId);
    } else {
      handleAddTask(data);
    }
  }, [handleAddTask, handleEditTask]);


  const handleToggleComplete = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    updateTask(id, { isCompleted: !task.isCompleted });
  }, [tasks, updateTask]);

  const handleToggleSubtaskComplete = useCallback((taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    const updatedSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st);
    updateTask(taskId, { subtasks: updatedSubtasks });
  }, [tasks, updateTask]);

  const handleDeleteTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      trashTask(id);
      toast({ title: "Task Moved to Trash", description: "Task moved to trash locally." });
      setTaskToDelete(null);
    } catch (error: any) {
      console.error("Error moving task to trash:", error);
      toast({ title: "Error", description: "Could not trash task.", variant: "destructive" });
      setTaskToDelete(null);
    }
  }, [tasks, trashTask, toast]);


  const handleOpenEditForm = useCallback((task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }, []);
  
  const handleOpenAddForm = useCallback(() => {
    setEditingTask(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEditView = useCallback((task: Task) => {
     setEditingTask(task);
     setIsFormOpen(true);
  }, []);
  
  const handleLabelSelect = useCallback((labelId: string | null) => {
    setSelectedLabelId(labelId);
    if (labelId) {
        setFilter('general'); 
    }
  }, []);


  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Sort by completion status (incomplete first)
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // If both are incomplete, sort by priority
      if (!a.isCompleted && !b.isCompleted) {
        const priorityA = priorityOrder[a.priority || "None"];
        const priorityB = priorityOrder[b.priority || "None"];
        if (priorityA !== priorityB) return priorityA - priorityB;
      }
      const dueDateA = a.dueDate ? parseISO(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dueDateB = b.dueDate ? parseISO(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (dueDateA !== dueDateB) {
        return dueDateA - dueDateB;
      }
      // Finally, sort by creation date (older first, for stable sort if all else equal)
      const createdAtA = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
      const createdAtB = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
      return createdAtA - createdAtB;
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let tasksToFilter = sortedTasks.filter(task => !task.isTrashed);

    if (selectedLabelId) {
      tasksToFilter = tasksToFilter.filter(task => task.labelId === selectedLabelId);
    }
    
    if (selectedLabelId && (filter === 'general' || filter === 'all')) {
        return tasksToFilter; 
    }

    switch (filter) {
      case 'pending':
        return tasksToFilter.filter(task => !task.isCompleted);
      case 'completed':
        return tasksToFilter.filter(task => task.isCompleted);
      case 'today':
        return tasksToFilter.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = parseISO(task.dueDate);
          return isValid(dueDate) && dateFnsIsToday(startOfDay(dueDate));
        });
      default: // 'all'
        return tasksToFilter;
    }
  }, [sortedTasks, filter, selectedLabelId]);

  if (!isMounted) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <>
      <AppSidebar onAddTask={handleOpenAddForm} currentFilter={filter} onFilterChange={setFilter} selectedLabelId={selectedLabelId} onLabelSelect={handleLabelSelect} />
      
      <main 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-200 ease-in-out"
        style={{ marginLeft: effectiveSidebarWidth }}
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <div className="w-full max-w-6xl mx-auto">
            <div className="mb-6 max-w-2xl mx-auto">
              <Button
                className="w-full h-12 px-4 py-3 text-base bg-card text-foreground/80 border border-border rounded-lg shadow justify-start hover:text-foreground hover:border-primary hover:bg-primary/10 hover:shadow-lg transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-background"
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
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full mt-1"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-1/4 mt-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <TaskList
                tasks={filteredTasks}
                onToggleComplete={handleToggleComplete}
                onEdit={handleOpenEditView}
                onDelete={(id) => setTaskToDelete(id)}
                onToggleSubtask={handleToggleSubtaskComplete}
              />
            )}
          </div>
        </div>
      </main>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingTask(null);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-card p-0">
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
          <SrAlertDialogHeader>
            <SrAlertDialogTitle>Move Task to Trash?</SrAlertDialogTitle>
            <AlertDialogDesc>
              This will move the task &quot;{(tasks.find(t => t.id === taskToDelete)?.title || tasks.find(t => t.id === taskToDelete)?.description)?.substring(0, 50)}...&quot; to the trash. You can restore it later from the Trash section.
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
