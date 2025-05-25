
"use client";

import type { Task } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BarChartBig, Activity, ListChecks, ClipboardList, Lightbulb, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

interface DashboardSectionProps {
  tasks: Task[];
}

export function DashboardSection({
  tasks,
}: DashboardSectionProps) {
  const totalTasks = tasks.length;
  const completedTasks = useMemo(() => tasks.filter(task => task.isCompleted).length, [tasks]);
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-6 max-w-6xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BarChartBig className="h-6 w-6 mr-3 text-primary" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Your academic and task performance overview.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Performance charts and detailed analytics coming soon!</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Activity className="h-6 w-6 mr-3 text-primary" />
            Task Insights
          </CardTitle>
          <CardDescription>Summary of your current tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-foreground">Overall Progress</span>
              <span className="text-sm font-semibold text-primary">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2.5" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-md">
              <h4 className="text-xs text-muted-foreground font-medium flex items-center justify-center mb-1">
                <ClipboardList className="h-4 w-4 mr-1.5" /> Pending
              </h4>
              <p className="text-2xl font-bold text-foreground">{pendingTasks}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-md">
              <h4 className="text-xs text-muted-foreground font-medium flex items-center justify-center mb-1">
                <ListChecks className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-500" /> Completed
              </h4>
              <p className="text-2xl font-bold text-foreground">{completedTasks}</p>
            </div>
          </div>
           <p className="text-xs text-center text-muted-foreground pt-2">
                Note: AI task prioritization is currently unavailable.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
