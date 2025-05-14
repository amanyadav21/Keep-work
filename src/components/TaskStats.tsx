"use client";

import type { Task } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TaskStatsProps {
  tasks: Task[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render placeholder or null during SSR to avoid hydration mismatch
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center">
            <Activity className="mr-2 h-5 w-5 text-primary" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Activity className="mr-2 h-5 w-5 text-primary" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </span>
            <span className="text-sm font-semibold text-primary">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} aria-label={`${completionPercentage}% tasks completed`} className="h-2" />
        </div>
        <p className="text-sm text-muted-foreground">
          <ListChecks className="inline h-4 w-4 mr-1 text-green-500" />
          You have <strong className="text-foreground">{pendingTasks}</strong> task{pendingTasks !== 1 ? 's' : ''} left. Keep going!
        </p>
      </CardContent>
    </Card>
  );
}
