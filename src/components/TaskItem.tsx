"use client";

import { useState, useEffect } from 'react';
import type { Task, TaskCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO, isValid } from 'date-fns';
import { Pencil, Trash2, BookOpen, Users, User, AlertTriangle } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const categoryIcons: Record<TaskCategory, React.ReactNode> = {
  Assignment: <BookOpen className="h-4 w-4 mr-1" />,
  Class: <Users className="h-4 w-4 mr-1" />,
  Personal: <User className="h-4 w-4 mr-1" />,
};

const categoryColors: Record<TaskCategory, string> = {
  Assignment: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};


export function TaskItem({ task, onToggleComplete, onEdit, onDelete }: TaskItemProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted || !task.dueDate) return;
    if (task.isCompleted) {
      setTimeLeft(''); // No countdown for completed tasks
      return;
    }

    const calculateTimeLeft = () => {
      const dueDateObj = parseISO(task.dueDate);
      if (!isValid(dueDateObj)) {
        setTimeLeft("Invalid date");
        return;
      }

      const now = new Date();
      const diffMillis = dueDateObj.getTime() - now.getTime();

      if (diffMillis <= 0) {
        setTimeLeft("Past due");
        return;
      }

      const days = differenceInDays(dueDateObj, now);
      const hours = differenceInHours(dueDateObj, now) % 24;
      const minutes = differenceInMinutes(dueDateObj, now) % 60;

      let timeLeftString = "";
      if (days > 0) timeLeftString += `${days}d `;
      if (hours > 0 || days > 0) timeLeftString += `${hours}h `;
      timeLeftString += `${minutes}m left`;
      
      setTimeLeft(timeLeftString);
    };

    calculateTimeLeft();
    const intervalId = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [task.dueDate, task.isCompleted, isMounted]);

  const dueDateObj = parseISO(task.dueDate);
  const formattedDueDate = isValid(dueDateObj) ? format(dueDateObj, "MMM dd, yyyy") : "Invalid Date";
  
  const isOverdue = !task.isCompleted && isValid(dueDateObj) && new Date() > dueDateObj;


  return (
    <Card className={cn(
      "transition-all duration-300 ease-in-out hover:shadow-xl",
      task.isCompleted ? "bg-muted/50 dark:bg-muted/30 opacity-70" : "bg-card",
      isOverdue ? "border-destructive/50" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-3">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={() => onToggleComplete(task.id)}
              aria-labelledby={`task-desc-${task.id}`}
            />
            <CardTitle 
              id={`task-desc-${task.id}`}
              className={cn(
                "text-lg font-semibold leading-tight",
                task.isCompleted ? "line-through text-muted-foreground" : "text-card-foreground"
              )}
            >
              {task.description}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Edit task">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} aria-label="Delete task" className="text-destructive hover:text-destructive/80">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Badge variant="outline" className={cn("py-1 px-2 text-xs flex items-center", categoryColors[task.category])}>
            {categoryIcons[task.category]}
            {task.category}
          </Badge>
          <p>Due: {formattedDueDate}</p>
        </div>
      </CardContent>
      {(timeLeft && !task.isCompleted && isMounted) && (
         <CardFooter className="pt-0 pb-3">
          <p className={cn(
            "text-xs font-medium",
            isOverdue || timeLeft === "Past due" ? "text-destructive" : "text-primary"
          )}>
            {isOverdue || timeLeft === "Past due" ? <AlertTriangle className="inline h-4 w-4 mr-1" /> : null}
            {timeLeft}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
