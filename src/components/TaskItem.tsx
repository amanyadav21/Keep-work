
"use client";

import { useState, useEffect } from 'react';
import type { Task, TaskCategory, Subtask } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO, isValid, isPast } from 'date-fns';
import { Pencil, Trash2, BookOpen, Users, User, AlertTriangle, CalendarDays, Brain, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from './ui/separator';


interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onRequestAIAssistance: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

const categoryIcons: Record<TaskCategory, React.ReactNode> = {
  Assignment: <BookOpen className="h-3 w-3" />,
  Class: <Users className="h-3 w-3" />,
  Personal: <User className="h-3 w-3" />,
};

const categoryBorderColors: Record<TaskCategory, string> = {
  Assignment: 'border-l-blue-500 dark:border-l-blue-400',
  Class: 'border-l-green-500 dark:border-l-green-400',
  Personal: 'border-l-purple-500 dark:border-l-purple-400',
};


export function TaskItem({ task, onToggleComplete, onEdit, onDelete, onRequestAIAssistance, onToggleSubtask }: TaskItemProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [showActions, setShowActions] = useState(false);


  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted || !task.dueDate) return;
    if (task.isCompleted) {
      setTimeLeft('Completed');
      return;
    }

    const calculateTimeLeft = () => {
      const dueDateObj = parseISO(task.dueDate);
      if (!isValid(dueDateObj)) {
        setTimeLeft("Invalid date");
        return;
      }

      const now = new Date();
      if (isPast(dueDateObj) && !task.isCompleted) {
        setTimeLeft("Past due");
        return;
      }
      
      const diffMillis = dueDateObj.getTime() - now.getTime();

      if (diffMillis <= 0) {
        setTimeLeft("Due now");
        return;
      }

      const days = differenceInDays(dueDateObj, now);
      const hours = differenceInHours(dueDateObj, now) % 24;
      const minutes = differenceInMinutes(dueDateObj, now) % 60;

      let timeLeftString = "";
      if (days > 0) timeLeftString += `${days}d `;
      if (hours > 0 || days > 0) timeLeftString += `${hours}h `; 
      if (minutes > 0 || (days === 0 && hours === 0)) timeLeftString += `${minutes}m `; 
      
      timeLeftString += "left";
      
      setTimeLeft(timeLeftString.trim());
    };

    calculateTimeLeft();
    const intervalId = setInterval(calculateTimeLeft, 60000); 

    return () => clearInterval(intervalId);
  }, [task.dueDate, task.isCompleted, isMounted]);

  const dueDateObj = parseISO(task.dueDate);
  const formattedDueDate = isValid(dueDateObj) ? format(dueDateObj, "MMM d") : "";
  
  const isOverdue = !task.isCompleted && isValid(dueDateObj) && isPast(dueDateObj);

  const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <TooltipProvider delayDuration={300}>
      <Card 
        className={cn(
          "group flex flex-col justify-between rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow duration-200 min-h-[180px]", 
          categoryBorderColors[task.category],
          "border-l-4", 
          task.isCompleted ? "bg-muted/30 dark:bg-muted/20 opacity-80" : "bg-card"
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <CardContent className="p-0 space-y-2 flex-grow">
          <div className="flex items-start space-x-3 mb-2">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={() => onToggleComplete(task.id)}
              aria-labelledby={`task-desc-${task.id}`}
              className="mt-1 shrink-0"
            />
            <p 
              id={`task-desc-${task.id}`}
              className={cn(
                "text-base font-medium text-foreground break-words", 
                task.isCompleted ? "line-through text-muted-foreground" : ""
              )}
            >
              {task.description}
            </p>
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="pl-7 space-y-1.5 mt-1 mb-2">
              {totalSubtasks > 0 && (
                 <div className="mb-1.5">
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-0.5">
                    <span>Subtasks</span>
                    <span>{completedSubtasks}/{totalSubtasks}</span>
                  </div>
                  <Progress value={subtaskProgress} className="h-1.5" />
                </div>
              )}
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subtask-${subtask.id}`}
                    checked={subtask.isCompleted}
                    onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                    className="h-3.5 w-3.5"
                    aria-labelledby={`subtask-text-${subtask.id}`}
                  />
                  <label
                    htmlFor={`subtask-${subtask.id}`}
                    id={`subtask-text-${subtask.id}`}
                    className={cn(
                      "text-xs text-muted-foreground break-words cursor-pointer",
                      subtask.isCompleted ? "line-through text-muted-foreground/70" : "text-foreground/90"
                    )}
                  >
                    {subtask.text}
                  </label>
                </div>
              ))}
               <Separator className="my-2" />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-0 mt-auto flex flex-col items-start space-y-2">
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="py-0.5 px-1.5 text-xs flex items-center border-dashed">
                {categoryIcons[task.category]}
                <span className="ml-1">{task.category}</span>
              </Badge>
              {formattedDueDate && (
                <div className="flex items-center">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  <span>{formattedDueDate}</span>
                </div>
              )}
            </div>
          </div>

          {(isMounted && timeLeft) && (
              <p className={cn(
                "text-xs font-medium",
                isOverdue || timeLeft === "Past due" ? "text-destructive" : task.isCompleted ? "text-green-600 dark:text-green-500" : "text-primary",
                "w-full" 
              )}>
                {isOverdue && !task.isCompleted ? <AlertTriangle className="inline h-3 w-3 mr-1" /> : null}
                {timeLeft}
              </p>
            )}

          <div className={cn(
              "flex items-center space-x-1 mt-2 transition-opacity duration-200 w-full justify-end",
              showActions || task.isCompleted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onRequestAIAssistance(task)} aria-label="Get AI Assistance" className="h-7 w-7 text-primary hover:text-primary/80">
                    <Brain className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get AI Assistance</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Edit task" className="h-7 w-7">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Task</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} aria-label="Delete task" className="text-destructive hover:text-destructive/80 h-7 w-7">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Task</p>
                </TooltipContent>
              </Tooltip>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
