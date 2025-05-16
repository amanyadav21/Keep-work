
"use client";

import type { Task } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, CheckCircle, ListTodo, Sparkles, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface TaskStatsProps {
  tasks: Task[];
  onSuggestPriorities: () => void; 
  isPrioritizing: boolean; 
}

export function TaskStats({ tasks, onSuggestPriorities, isPrioritizing }: TaskStatsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Card className="shadow-sm rounded-lg border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center font-medium">
            <Activity className="mr-2 h-5 w-5 text-primary" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-muted rounded animate-pulse"></div>
            <div className="h-12 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted rounded animate-pulse mt-2"></div>
        </CardContent>
      </Card>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="shadow-sm rounded-lg border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center font-medium">
          <Activity className="mr-2 h-5 w-5 text-primary" />
          Summary
        </CardTitle>
        <CardDescription>Your task completion overview.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-medium text-foreground">
              Overall Progress
            </span>
            <span className="font-semibold text-primary">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} aria-label={`${completionPercentage}% tasks completed`} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
                <ListTodo className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <div>
                    <p className="text-muted-foreground">Pending</p>
                    <p className="font-semibold text-lg text-foreground">{pendingTasks}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="font-semibold text-lg text-foreground">{completedTasks}</p>
                </div>
            </div>
        </div>
         {totalTasks > 0 && pendingTasks === 0 && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-md mt-3">
            <Sparkles className="mx-auto h-8 w-8 text-green-500 dark:text-green-400 mb-2" />
            <p className="text-md font-semibold text-green-700 dark:text-green-300">
              All tasks completed! Great job!
            </p>
          </div>
        )}
        {pendingTasks > 0 && (
          <Button 
            onClick={onSuggestPriorities} 
            className="w-full mt-2"
            variant="outline"
            disabled={isPrioritizing}
          >
            <Brain className={`mr-2 h-4 w-4 ${isPrioritizing ? 'animate-pulse' : ''}`} />
            {isPrioritizing ? 'Thinking...' : 'Suggest Priorities'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

