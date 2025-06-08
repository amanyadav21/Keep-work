
"use client";

import { useState, useEffect, memo } from 'react';
import type { Task, TaskCategory, TaskPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, isValid, isPast, isToday, isTomorrow, isYesterday, differenceInCalendarDays, formatDistanceToNowStrict } from 'date-fns';
import { Pencil, Trash2, Users, User, AlertTriangle, CalendarDays, ListChecks, BookOpen, Inbox, Bell, BellPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

const categoryIcons: Record<TaskCategory, React.ElementType> = {
  General: Inbox,
  Assignment: BookOpen,
  Class: Users,
  Personal: User,
};

function formatDynamicDueDate(isoDateString: string): string {
  const date = parseISO(isoDateString);
  if (!isValid(date)) return "Invalid date";

  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";

  const today = new Date();
  const diffDays = differenceInCalendarDays(date, today);

  if (diffDays > 0 && diffDays <= 6) return format(date, "'Next' EEEE"); // e.g., Next Monday
  if (diffDays < 0 && diffDays >= -6) return format(date, "'Last' EEEE"); // e.g., Last Monday

  // For dates further out, or in a different year, show more detail
  if (date.getFullYear() === today.getFullYear()) return format(date, "MMM d"); // e.g., Oct 15
  return format(date, "MMM d, yyyy"); // e.g., Oct 15, 2023
}

function formatReminderDateTime(isoDateTimeString: string | null | undefined): string | null {
  if (!isoDateTimeString) return null;
  const date = parseISO(isoDateTimeString);
  if (!isValid(date)) return null;
  
  // Example: "Tomorrow, 9:00 AM" or "Oct 25, 2:30 PM" or "Today, 5:00 PM"
  let datePart;
  if (isToday(date)) datePart = "Today";
  else if (isTomorrow(date)) datePart = "Tomorrow";
  else if (isYesterday(date)) datePart = "Yesterday";
  else datePart = format(date, "MMM d");

  return `${datePart}, ${format(date, "p")}`; // 'p' for localized time, e.g., 9:00 AM
}


function TaskItemComponent({ task, onToggleComplete, onEdit, onDelete, onToggleSubtask }: TaskItemProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (task.isCompleted) {
      setTimeLeft('Completed');
      return;
    }

    if (!task.dueDate) {
      setTimeLeft('No due date');
      return;
    }

    const calculateTimeLeft = () => {
      const dueDateObj = parseISO(task.dueDate);
      if (!isValid(dueDateObj)) {
        setTimeLeft("Invalid date format");
        return;
      }

      if (isPast(dueDateObj) && !isToday(dueDateObj)) {
        setTimeLeft("Past due");
        return;
      }

      const timeLeftString = formatDistanceToNowStrict(dueDateObj, { addSuffix: true });
      setTimeLeft(timeLeftString.replace(/^in\s+/, '') + (isToday(dueDateObj) ? "" : " left"));
    };

    calculateTimeLeft();
    const intervalId = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [task.dueDate, task.isCompleted, isMounted]);


  const dueDateObj = task.dueDate ? parseISO(task.dueDate) : null;
  const formattedDynamicDueDate = task.dueDate ? formatDynamicDueDate(task.dueDate) : "No due date";
  const isOverdue = !task.isCompleted && dueDateObj && isValid(dueDateObj) && isPast(dueDateObj) && !isToday(dueDateObj);

  const reminderDateTimeFormatted = formatReminderDateTime(task.reminderAt);


  const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const CategoryIcon = categoryIcons[task.category] || User;

  const cardClickHandler = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    // Prevent card click from triggering if a button, checkbox, or link inside was clicked
    let target = e.target as HTMLElement;
    while (target && target !== e.currentTarget) {
      if (target.matches('input[type="checkbox"], button, a, [data-nocardclick="true"]') || target.closest('[data-nocardclick="true"]')) {
        return;
      }
      target = target.parentElement as HTMLElement;
    }
    onEdit(task); // Open edit modal
  };

 const getPriorityDotClass = (priority?: TaskPriority) => {
    switch (priority) {
      case "Urgent":
        return "bg-[hsl(var(--priority-urgent))]";
      case "High":
        return "bg-[hsl(var(--priority-high))]";
      case "Medium":
        return "bg-[hsl(var(--priority-medium))]";
      case "Low":
        return "bg-[hsl(var(--priority-low))]";
      default:
        return "bg-transparent"; // No dot if no priority or "None"
    }
  };


  return (
    <TooltipProvider delayDuration={150}>
      <Card
        className={cn(
          "group flex flex-col justify-between rounded-lg border text-card-foreground shadow-sm hover:shadow-md focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-1 transition-shadow duration-150",
          task.isCompleted ? "bg-muted/40 dark:bg-muted/30" : "bg-card",
          isOverdue && !task.isCompleted ? "border-destructive/40 shadow-destructive/5" : "border-border"
        )}
        onClick={cardClickHandler}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cardClickHandler(e); } }}
        role="button"
        tabIndex={0}
        aria-label={`Edit task: ${task.title || task.description}`}
      >
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id={`task-complete-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={() => onToggleComplete(task.id)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();}}
              aria-labelledby={`task-title-${task.id}`}
              data-nocardclick="true"
              className="mt-1 h-5 w-5 shrink-0 rounded-sm border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {task.priority && task.priority !== "None" && (
                  <Tooltip>
                    <TooltipTrigger asChild data-nocardclick="true">
                      <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", getPriorityDotClass(task.priority))} />
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start"><p>{task.priority} Priority</p></TooltipContent>
                  </Tooltip>
                )}
                <CardTitle
                  id={`task-title-${task.id}`}
                  className={cn(
                    "text-base font-semibold text-foreground break-words line-clamp-2 leading-snug",
                    task.isCompleted && (task.title || task.description) ? "line-through text-muted-foreground" : ""
                  )}
                >
                  {task.title || task.description }
                </CardTitle>
              </div>
              {task.title && task.description && task.title !== task.description && (
                <CardDescription className={cn(
                  "text-xs text-muted-foreground line-clamp-3 mt-1 leading-normal",
                  task.priority && task.priority !== "None" ? "ml-[calc(0.625rem+0.5rem)]" : "", // 0.625rem for dot, 0.5rem for gap
                  task.isCompleted && "line-through"
                )}>
                  {task.description}
                </CardDescription>
              )}
            </div>
          </div>

          {(task.subtasks && task.subtasks.length > 0) && (
            <div className={cn("mt-2 space-y-1.5 pl-[calc(1.25rem+0.75rem)]", task.title && task.description && task.title !== task.description && "pt-1")}>
              {(task.title && task.description && task.title !== task.description || (task.subtasks && task.subtasks.length > 0)) && <Separator className="mb-2" />}
              {totalSubtasks > 0 && (
                 <div className="mb-1.5 px-0.5">
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-0.5">
                    <span className="font-medium text-[11px] uppercase tracking-wider">Subtasks</span>
                    <span className="text-[11px]">{completedSubtasks}/{totalSubtasks}</span>
                  </div>
                  <Progress value={subtaskProgress} className="h-1 bg-primary/20 [&>div]:bg-primary" />
                </div>
              )}
              <ScrollArea className="max-h-24 pr-1 -mr-1">
                <div className="space-y-1 py-0.5">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-1.5 group/subtask p-0.5 rounded hover:bg-muted/50 transition-colors" data-nocardclick="true">
                    <Checkbox
                      id={`subtask-${task.id}-${subtask.id}`}
                      checked={subtask.isCompleted}
                      onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();}}
                      className="h-3.5 w-3.5 shrink-0 border-primary/70 data-[state=checked]:bg-primary"
                      aria-labelledby={`subtask-text-${task.id}-${subtask.id}`}
                    />
                    <label
                      htmlFor={`subtask-${task.id}-${subtask.id}`}
                      id={`subtask-text-${task.id}-${subtask.id}`}
                      className={cn(
                        "text-xs break-words cursor-pointer flex-1 leading-tight",
                        subtask.isCompleted ? "line-through text-muted-foreground/70" : "text-foreground/90",
                        "group-hover/subtask:text-foreground"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {subtask.text}
                    </label>
                  </div>
                ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <CardFooter className="p-3 mt-auto border-t bg-muted/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild data-nocardclick="true">
                <Badge variant="outline" className="text-xs py-0.5 px-1.5 font-normal shrink-0 border-border bg-background hover:bg-muted/80">
                  <CategoryIcon className={cn("h-3 w-3 mr-1", task.isCompleted ? "text-muted-foreground/70" : "text-primary/80")} />
                  {task.category}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start"><p>Category: {task.category}</p></TooltipContent>
            </Tooltip>

            {task.dueDate && (
              <Tooltip>
                <TooltipTrigger asChild data-nocardclick="true">
                  <div className={cn("flex items-center shrink-0", isOverdue ? "text-destructive font-medium" : "")}>
                      <CalendarDays className="h-3.5 w-3.5 mr-1" />
                      <span className="truncate">{formattedDynamicDueDate}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start"><p>Due: {format(parseISO(task.dueDate), "PPPp")}</p></TooltipContent>
              </Tooltip>
            )}
             {(isMounted && timeLeft && (!isOverdue || task.isCompleted)) && ( // Show timeLeft if not already shown as overdue
              <Tooltip>
                <TooltipTrigger asChild data-nocardclick="true">
                  <p className={cn(
                    "font-normal text-xs flex items-center truncate",
                    task.isCompleted ? "text-[hsl(var(--status-green))]" :
                    (task.dueDate && isToday(parseISO(task.dueDate))) ? "text-[hsl(var(--priority-medium))]" :
                    "text-primary/90"
                  )}>
                    {isOverdue && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                    {timeLeft}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  <p>{task.isCompleted ? "Completed" : timeLeft}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {reminderDateTimeFormatted && (
              <Tooltip>
                <TooltipTrigger asChild data-nocardclick="true">
                  <div className="flex items-center text-accent shrink-0">
                    <Bell className="h-3.5 w-3.5 mr-1" />
                    <span className="truncate">{reminderDateTimeFormatted.split(',')[0]}</span> {/* Show only date part for brevity */}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start"><p>Reminder: {reminderDateTimeFormatted}</p></TooltipContent>
              </Tooltip>
            )}
          </div>
           <div
            className="flex items-center space-x-0.5 flex-shrink-0"
            onClick={(e) => e.stopPropagation()} // Prevent card click from firing
            onKeyDown={(e) => e.stopPropagation()}
            data-nocardclick="true"
          >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Set or edit reminder" className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10">
                    <BellPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Set/Edit Reminder</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Edit task" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit Task</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} aria-label="Delete task" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-7 w-7">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Move to Trash</p></TooltipContent>
              </Tooltip>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}

export const TaskItem = memo(TaskItemComponent);

