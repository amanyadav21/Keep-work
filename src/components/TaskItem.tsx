
"use client";

import { useState, useEffect, memo } from 'react';
import type { Task, TaskCategory, TaskPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, isValid, isPast, isToday, isTomorrow, isYesterday, differenceInCalendarDays, formatDistanceToNowStrict } from 'date-fns';
import { Pencil, Trash2, Users, User, AlertTriangle, CalendarDays, ListChecks, BookOpen, Flag } from 'lucide-react';
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
  Assignment: BookOpen,
  Class: Users,
  Personal: User,
};

const priorityDotColor = (priority?: TaskPriority): string => {
  switch (priority) {
    case 'High':
      return 'bg-[hsl(var(--priority-high))]';
    case 'Medium':
      return 'bg-[hsl(var(--priority-medium))]';
    case 'Low':
      return 'bg-[hsl(var(--priority-low))]';
    default:
      return 'bg-transparent'; 
  }
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
    const intervalId = setInterval(calculateTimeLeft, 60000); 

    return () => clearInterval(intervalId); 
  }, [task.dueDate, task.isCompleted, isMounted]);


  const dueDateObj = task.dueDate ? parseISO(task.dueDate) : null;
  const formattedDynamicDueDate = task.dueDate ? formatDynamicDueDate(task.dueDate) : "No due date";
  const isOverdue = !task.isCompleted && dueDateObj && isValid(dueDateObj) && isPast(dueDateObj) && !isToday(dueDateObj);


  const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const CategoryIcon = categoryIcons[task.category] || User;

  const cardClickHandler = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    let target = e.target as HTMLElement;
    while (target && target !== e.currentTarget) {
      if (target.matches('input[type="checkbox"], button, a, [data-nocardclick="true"]')) {
        return; 
      }
      target = target.parentElement as HTMLElement;
    }
    onEdit(task);
  };
  
  return (
    <TooltipProvider delayDuration={150}>
      <Card
        className={cn(
          "group flex flex-col justify-between rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          task.isCompleted ? "bg-muted/60 dark:bg-muted/30 hover:shadow-md" : "bg-card"
        )}
        onClick={cardClickHandler}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cardClickHandler(e);}}
        role="button"
        tabIndex={0}
        aria-label={`Edit task: ${task.title || task.description}`}
      >
        <CardHeader className="p-4 pb-2 relative">
           <Checkbox
            id={`task-complete-${task.id}`}
            checked={task.isCompleted}
            onCheckedChange={() => onToggleComplete(task.id)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();}}
            aria-labelledby={`task-title-${task.id}`}
            data-nocardclick="true"
            className="absolute top-3 right-3 h-5 w-5 shrink-0 z-10 rounded-sm border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <div className="flex items-start gap-2 pr-8">
            {task.priority && task.priority !== "None" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn("mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0", priorityDotColor(task.priority))} data-nocardclick="true" aria-label={`${task.priority} priority`}></span>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <p>{task.priority} Priority</p>
                </TooltipContent>
              </Tooltip>
            )}
            <CardTitle
              id={`task-title-${task.id}`}
              className={cn(
                "text-lg font-semibold text-foreground break-words line-clamp-2", 
                task.priority && task.priority !== "None" ? "" : "ml-0", 
                task.isCompleted && (task.title || task.description) ? "line-through text-muted-foreground" : ""
              )}
            >
              {task.title || task.description }
            </CardTitle>
          </div>
          {task.title && task.description && ( 
            <CardDescription className={cn("text-sm text-muted-foreground line-clamp-3 mt-1", task.priority && task.priority !== "None" ? "ml-[calc(0.625rem+0.5rem)]" : "ml-0", task.isCompleted && "line-through")}>
              {task.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow flex flex-col min-h-0">
          <div className="flex-1 min-h-0 flex flex-col">
            {task.subtasks && task.subtasks.length > 0 ? (
              <div className="mt-2 space-y-2 flex-1 flex flex-col min-h-0">
                <Separator className="mb-2" />
                {totalSubtasks > 0 && (
                   <div className="mb-1.5 px-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-0.5">
                      <span className="font-medium">Subtasks</span>
                      <span>{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                    <Progress value={subtaskProgress} className="h-1.5 bg-primary/20 [&>div]:bg-primary" />
                  </div>
                )}
                <ScrollArea className="flex-1 pr-1 -mr-1 max-h-28"> 
                  <div className="space-y-1.5 py-0.5 px-1">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center space-x-2 group/subtask p-1 rounded hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`subtask-${task.id}-${subtask.id}`}
                        checked={subtask.isCompleted}
                        onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();}}
                        data-nocardclick="true"
                        className="h-4 w-4 shrink-0 border-primary/70 data-[state=checked]:bg-primary"
                        aria-labelledby={`subtask-text-${task.id}-${subtask.id}`}
                      />
                      <label
                        htmlFor={`subtask-${task.id}-${subtask.id}`}
                        id={`subtask-text-${task.id}-${subtask.id}`}
                        className={cn(
                          "text-sm break-words cursor-pointer flex-1",
                          subtask.isCompleted ? "line-through text-muted-foreground/70" : "text-foreground/90",
                          "group-hover/subtask:text-foreground"
                        )}
                        onClick={(e) => e.stopPropagation()} 
                        data-nocardclick="true"
                      >
                        {subtask.text}
                      </label>
                    </div>
                  ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex-1"></div> 
            )}
          </div>
          
          <div className={cn(
            "pt-3 text-xs flex items-center justify-between gap-x-2", 
            task.isCompleted ? "text-muted-foreground" : "text-muted-foreground/90"
          )}>
            <Badge variant="secondary" className="text-xs py-0.5 px-1.5 font-medium shrink-0 bg-secondary/70 text-secondary-foreground">
              <CategoryIcon className={cn("h-3.5 w-3.5 mr-1", task.isCompleted ? "text-muted-foreground/80" : "text-primary")} />
              {task.category}
            </Badge>
             {task.dueDate && (
              <div className={cn("flex items-center shrink-0", isOverdue ? "text-destructive font-medium" : "")}>
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  <span className="truncate">{formattedDynamicDueDate}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-3 mt-auto border-t flex items-center justify-between">
          <div className="flex-shrink-0">
            {(isMounted && timeLeft) && (
              <p className={cn(
                "font-medium text-xs flex items-center",
                isOverdue ? "text-destructive" : 
                task.isCompleted ? "text-[hsl(var(--status-green))]" :
                (task.dueDate && isToday(parseISO(task.dueDate)) && !task.isCompleted) ? "text-accent" : 
                "text-primary"
              )}>
                {isOverdue && <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />}
                {timeLeft}
              </p>
            )}
          </div>
           <div 
            className={cn(
              "flex items-center space-x-1",
              task.isCompleted ? "opacity-60" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150"
            )}
            onClick={(e) => e.stopPropagation()} 
            onKeyDown={(e) => e.stopPropagation()} 
            data-nocardclick="true"
          >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(task); }} data-nocardclick="true" aria-label="Edit task" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Task</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} data-nocardclick="true" aria-label="Delete task" className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 h-7 w-7">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Move to Trash</p>
                </TooltipContent>
              </Tooltip>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}

export const TaskItem = memo(TaskItemComponent);

