
"use client";

import { useState, useEffect, memo } from 'react';
import type { Task, TaskCategory, TaskPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
// Card components are no longer used for the main structure, but CardDescription might be useful for styling
import { CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, isValid, isPast, isToday, isTomorrow, isYesterday, differenceInCalendarDays, formatDistanceToNowStrict } from 'date-fns';
import { Pencil, Trash2, Users, User, AlertTriangle, CalendarDays, ListChecks, BookOpen, Inbox, Bell, MoreVertical, Brain } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  if (diffDays > 0 && diffDays <= 6) return format(date, "'Next' EEEE"); 
  if (diffDays < 0 && diffDays >= -6) return format(date, "'Last' EEEE"); 

  if (date.getFullYear() === today.getFullYear()) return format(date, "MMM d"); 
  return format(date, "MMM d, yyyy"); 
}

function formatReminderDateTime(isoDateTimeString: string | null | undefined): string | null {
  if (!isoDateTimeString) return null;
  const date = parseISO(isoDateTimeString);
  if (!isValid(date)) return null;
  
  let datePart;
  if (isToday(date)) datePart = "Today";
  else if (isTomorrow(date)) datePart = "Tomorrow";
  else if (isYesterday(date)) datePart = "Yesterday";
  else datePart = format(date, "MMM d");

  return `${datePart}, ${format(date, "p")}`; 
}

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
        return "bg-transparent"; 
    }
  };

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
      const dueDateObj = parseISO(task.dueDate as string);
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
    const intervalId = setInterval(calculateTimeLeft, 60000); 

    return () => clearInterval(intervalId);
  }, [task.dueDate, task.isCompleted, isMounted]);

  const dueDateObj = task.dueDate ? parseISO(task.dueDate) : null;
  const formattedDynamicDueDate = task.dueDate ? formatDynamicDueDate(task.dueDate) : null; // Null if no due date
  const isOverdue = !task.isCompleted && dueDateObj && isValid(dueDateObj) && isPast(dueDateObj) && !isToday(dueDateObj);
  const reminderDateTimeFormatted = formatReminderDateTime(task.reminderAt);

  const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const CategoryIcon = categoryIcons[task.category] || User;

  const cardClickHandler = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    let target = e.target as HTMLElement;
    while (target && target !== e.currentTarget) {
      if (target.matches('input[type="checkbox"], button, a, [data-nocardclick="true"], [role="menuitem"], [role="menu"]') || target.closest('[data-nocardclick="true"], [role="menuitem"], [role="menu"]')) {
        return;
      }
      target = target.parentElement as HTMLElement;
    }
    onEdit(task); 
  };
  
  const hasVisibleTitle = task.title && task.title.trim() !== '';
  const hasVisibleDescription = task.description && task.description.trim() !== '';

  return (
    <TooltipProvider delayDuration={150}>
      <div // Changed from Card to div
        className={cn(
          "group flex flex-col justify-between rounded-lg border text-card-foreground shadow-md hover:shadow-lg focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-background transition-all duration-150 ease-in-out",
          "px-4 py-3", // Google Keep-like padding
          task.isCompleted ? "bg-muted/60 dark:bg-muted/50" : "bg-card",
          isOverdue && !task.isCompleted ? "border-destructive/50 shadow-destructive/10" : "border-border"
        )}
        onClick={cardClickHandler}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cardClickHandler(e); } }}
        role="button"
        tabIndex={0}
        aria-label={`Edit task: ${task.title || task.description}`}
      >
        {/* Main content area */}
        <div className="flex-grow mb-3 min-h-[2.5rem]"> {/* Min height to ensure card has some body even if empty */}
          <div className="flex items-start gap-3">
             {/* Priority Dot - Placed before checkbox, aligned with title more */}
             {task.priority && task.priority !== "None" && (
              <Tooltip>
                <TooltipTrigger asChild data-nocardclick="true">
                  <div className={cn("h-3 w-3 rounded-full shrink-0 mt-1.5", getPriorityDotClass(task.priority))} />
                </TooltipTrigger>
                <TooltipContent side="top" align="start"><p>{task.priority} Priority</p></TooltipContent>
              </Tooltip>
            )}
            <div className="flex-1 min-w-0">
              {hasVisibleTitle && (
                <h3
                  id={`task-title-${task.id}`}
                  className={cn(
                    "text-base font-medium text-foreground break-words", 
                    task.isCompleted && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </h3>
              )}
              {hasVisibleDescription && (
                <p className={cn(
                  "text-sm text-foreground/80 dark:text-foreground/70 whitespace-pre-wrap break-words mt-1.5", 
                  task.isCompleted && "line-through text-muted-foreground/70",
                  !hasVisibleTitle && "text-base font-medium" // If no title, make desc look like title
                )}>
                  {task.description}
                </p>
              )}
              {/* If both title and description are empty, show a placeholder or give some minimal content indication */}
              {!hasVisibleTitle && !hasVisibleDescription && (
                <p className="text-sm text-muted-foreground italic">(Empty task)</p>
              )}
            </div>
            <Checkbox
              id={`task-complete-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={() => onToggleComplete(task.id)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();}}
              aria-labelledby={`task-title-${task.id}`}
              data-nocardclick="true"
              className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
          </div>

          {(task.subtasks && task.subtasks.length > 0) && (
            <div className={cn("mt-3 space-y-1.5", task.isCompleted ? "opacity-70" : "")}>
              <Separator className="mb-2" />
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
                <div className="space-y-1.5 py-0.5"> 
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
                        "text-xs break-words cursor-pointer flex-1", 
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

        {/* Footer - keep it minimal and always visible */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-border/30 -mx-4 -mb-3 px-3 pb-2 rounded-b-lg bg-card/30 dark:bg-background/10 group-hover:bg-card/50 dark:group-hover:bg-background/20 transition-colors"> 
          <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden"> 
            <Tooltip>
              <TooltipTrigger asChild data-nocardclick="true">
                <Badge variant="outline" className="text-[11px] py-0.5 px-1.5 font-normal shrink-0 border-border bg-transparent hover:bg-muted/80 cursor-default">
                  <CategoryIcon className={cn("h-3 w-3 mr-1", task.isCompleted ? "text-muted-foreground/70" : "text-primary/80")} />
                  {task.category}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start"><p>Category: {task.category}</p></TooltipContent>
            </Tooltip>

            {formattedDynamicDueDate && (
              <Tooltip>
                <TooltipTrigger asChild data-nocardclick="true">
                  <div className={cn("flex items-center shrink-0 cursor-default", isOverdue ? "text-destructive font-medium" : "")}>
                      <CalendarDays className="h-3.5 w-3.5 mr-1" />
                      <span className="truncate text-[11px]">{formattedDynamicDueDate}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start"><p>Due: {dueDateObj ? format(dueDateObj, "PPPp") : 'N/A'}</p></TooltipContent>
              </Tooltip>
            )}
            {reminderDateTimeFormatted && (
              <Tooltip>
                <TooltipTrigger asChild data-nocardclick="true">
                  <div className="flex items-center text-accent shrink-0 cursor-default">
                    <Bell className="h-3.5 w-3.5 mr-1" />
                    <span className="truncate text-[11px]">{reminderDateTimeFormatted.split(',')[0]}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start"><p>Reminder: {reminderDateTimeFormatted}</p></TooltipContent>
              </Tooltip>
            )}
             {(isMounted && timeLeft && !isOverdue && !task.isCompleted && !formattedDynamicDueDate && !reminderDateTimeFormatted) && ( 
              <Tooltip>
                <TooltipTrigger asChild data-nocardclick="true">
                   <p className={cn("font-normal text-[11px] flex items-center truncate cursor-default", task.isCompleted ? "text-[hsl(var(--status-green))]" : "text-muted-foreground")}>
                    {timeLeft === "No due date" ? "" : timeLeft}
                  </p>
                </TooltipTrigger>
                 <TooltipContent side="bottom" align="start">
                  <p>{task.isCompleted ? "Completed" : timeLeft}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
           <div
            className="flex items-center space-x-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150" 
            onClick={(e) => e.stopPropagation()} 
            onKeyDown={(e) => e.stopPropagation()}
            data-nocardclick="true"
          >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); router.push(`/ai-assistant?taskDescription=${encodeURIComponent(task.title || task.description || '')}`);}} data-nocardclick="true">
                    <Brain className="h-4 w-4" />
                    <span className="sr-only">AI Assistant for this task</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>AI Assistant</p></TooltipContent>
              </Tooltip>

             <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" data-nocardclick="true">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Task Options</span>
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>More options</p></TooltipContent>
                </Tooltip>
                <DropdownMenuContent side="bottom" align="end" onClick={(e) => e.stopPropagation()} data-nocardclick="true">
                    <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit / Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Move to Trash</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export const TaskItem = memo(TaskItemComponent);


    