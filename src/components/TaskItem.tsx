
"use client";

import { useState, useEffect, memo } from 'react';
import type { Task, TaskCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, isValid, isPast, formatDistanceToNowStrict } from 'date-fns';
import { Pencil, Trash2, Users, User, AlertTriangle, CalendarDays, Brain, ListChecks, BookOpen } from 'lucide-react';
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

      if (isPast(dueDateObj)) {
        setTimeLeft("Past due");
        return;
      }
      
      const timeLeftString = formatDistanceToNowStrict(dueDateObj, { addSuffix: true });
      setTimeLeft(timeLeftString.replace(/^in\s+/, '') + " left");
    };

    calculateTimeLeft(); 
    const intervalId = setInterval(calculateTimeLeft, 60000); 

    return () => clearInterval(intervalId); 
  }, [task.dueDate, task.isCompleted, isMounted]);


  const dueDateObj = task.dueDate ? parseISO(task.dueDate) : null;
  const formattedDueDate = dueDateObj && isValid(dueDateObj) ? format(dueDateObj, "MMM d, yyyy") : "No due date";
  const isOverdue = !task.isCompleted && dueDateObj && isValid(dueDateObj) && isPast(dueDateObj);


  const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const CategoryIcon = categoryIcons[task.category] || User;

  return (
    <TooltipProvider delayDuration={150}>
      <Card
        className={cn(
          "group flex flex-col justify-between rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-200 min-h-[180px]",
          task.isCompleted ? "bg-muted/70 dark:bg-muted/40" : "bg-card" // Adjusted completed task background
        )}
      >
        <CardContent className="p-4 relative flex-grow flex flex-col">
          <Checkbox
            id={`task-complete-${task.id}`}
            checked={task.isCompleted}
            onCheckedChange={() => onToggleComplete(task.id)}
            aria-labelledby={`task-desc-${task.id}`}
            className="absolute top-3 right-3 h-5 w-5 shrink-0 z-10"
          />
          <CardTitle
            id={`task-desc-${task.id}`}
            className={cn(
              "text-lg font-semibold text-foreground break-words pr-10 line-clamp-3 mb-1.5", 
              task.isCompleted ? "line-through text-muted-foreground" : ""
            )}
          >
            {task.description}
          </CardTitle>

          <div className="flex-1 min-h-0 flex flex-col">
            {task.subtasks && task.subtasks.length > 0 ? (
              <div className="mt-3 space-y-2 flex-1 flex flex-col min-h-0">
                <Separator className="mb-2" />
                {totalSubtasks > 0 && (
                   <div className="mb-1.5">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-0.5">
                      <span className="font-medium">Subtasks</span>
                      <span>{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                    <Progress value={subtaskProgress} className="h-1.5 bg-primary/20 [&>div]:bg-primary" />
                  </div>
                )}
                <ScrollArea className="flex-1 pr-1 -mr-1"> 
                  <div className="space-y-1.5 py-0.5">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subtask-${task.id}-${subtask.id}`}
                        checked={subtask.isCompleted}
                        onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                        className="h-4 w-4 shrink-0"
                        aria-labelledby={`subtask-text-${task.id}-${subtask.id}`}
                      />
                      <label
                        htmlFor={`subtask-${task.id}-${subtask.id}`}
                        id={`subtask-text-${task.id}-${subtask.id}`}
                        className={cn(
                          "text-sm break-words cursor-pointer flex-1",
                          subtask.isCompleted ? "line-through text-muted-foreground/70" : "text-foreground/90"
                        )}
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
              <div className="flex items-center shrink-0">
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  <span className="truncate">{formattedDueDate}</span>
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
                task.isCompleted ? "text-[hsl(var(--status-green))]" : // Using hsl for status-green
                "text-primary"
              )}>
                {isOverdue && <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />}
                {timeLeft}
              </p>
            )}
          </div>
           <div className={cn(
              "flex items-center space-x-1",
              task.isCompleted ? "opacity-60" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
            )}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" aria-label="Get AI Assistance" className="h-7 w-7 text-primary hover:text-primary/80 hover:bg-primary/10">
                    <Link href={`/ai-assistant?taskDescription=${encodeURIComponent(task.description)}`}>
                      <Brain className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get AI Assistance</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Edit task" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Task</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} aria-label="Delete task" className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 h-7 w-7">
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
