
"use client";

import type { Task } from '@/types';
import { TaskStats } from '@/components/TaskStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartBig, Activity } from 'lucide-react';

interface DashboardSectionProps {
  tasks: Task[];
  onSuggestPriorities: () => void;
  isPrioritizing: boolean;
}

export function DashboardSection({ tasks, onSuggestPriorities, isPrioritizing }: DashboardSectionProps) {
  return (
    <section className="container mx-auto w-full py-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Metrics Section */}
        <Card className="shadow-sm rounded-lg border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center font-medium">
              <BarChartBig className="mr-2 h-5 w-5 text-primary" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detailed performance charts and metrics will be displayed here in a future update.
            </p>
            {/* Placeholder for future charts */}
            <div className="mt-4 h-40 bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground">
              Chart Placeholder
            </div>
          </CardContent>
        </Card>

        {/* Task Insights Section */}
        <div className="space-y-2">
           {/* TaskStats is already a Card, so no need to wrap it in another Card if it styles itself.
               If TaskStats is not a Card, we can wrap it:
           <Card className="shadow-sm rounded-lg border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center font-medium">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Task Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskStats
                tasks={tasks}
                onSuggestPriorities={onSuggestPriorities}
                isPrioritizing={isPrioritizing}
              />
            </CardContent>
           </Card>
           */}
           {/* Directly using TaskStats as it is already a Card component */}
           <TaskStats
              tasks={tasks}
              onSuggestPriorities={onSuggestPriorities}
              isPrioritizing={isPrioritizing}
            />
        </div>
      </div>
    </section>
  );
}
