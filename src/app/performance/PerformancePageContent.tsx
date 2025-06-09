
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BarChart3, CheckCircle, TrendingUp, CalendarDays, Loader2, Activity } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import type { TaskFilter } from '@/types';
import { cn } from '@/lib/utils'; // Added missing import


export default function PerformancePageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // Dummy filter state for AppSidebar prop - this page doesn't actively filter tasks shown here
  const [currentFilter, setCurrentFilter] = useState<TaskFilter>('all');


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/login');
    }
  }, [mounted, authLoading, user, router]);

  if (authLoading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Redirecting to login...</p>
      </div>
    );
  }

  const analyticsData = [
    {
      id: 'completionRate',
      title: 'Task Completion Rate',
      icon: CheckCircle,
      value: '78%',
      description: 'Percentage of tasks marked as complete.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      id: 'tasksOverTime',
      title: 'Tasks Completed This Week',
      icon: TrendingUp,
      value: '42',
      description: 'Number of tasks completed in the last 7 days.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'activityStreak',
      title: 'Longest Activity Streak',
      icon: Activity,
      value: '12 days',
      description: 'Consecutive days with at least one task completed.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      id: 'productiveDay',
      title: 'Most Productive Day',
      icon: CalendarDays,
      value: 'Wednesday',
      description: 'Day of the week with the most task completions.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <>
    {/* AppSidebar needs onAddTask, currentFilter, onFilterChange. Provide dummy ones if not interactive here. */}
    <AppSidebar onAddTask={() => { /* No new tasks from here */ }} currentFilter={currentFilter} onFilterChange={() => {}} />
    <Header /> {/* Header does not need onAddTask from this page */}
    <div className="flex flex-col min-h-screen bg-muted/40 dark:bg-background">
      <header className="py-4 px-4 md:px-6 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-30">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight flex items-center">
            <BarChart3 className="h-6 w-6 mr-2.5 text-primary" />
            Performance Overview
          </h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Your Analytics Dashboard</CardTitle>
              <CardDescription>
                An overview of your task management activity and productivity trends. More detailed charts and reports are coming soon!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyticsData.map((item) => (
                  <Card key={item.id} className={cn("shadow-md hover:shadow-lg transition-shadow", item.bgColor)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground/80">{item.title}</CardTitle>
                      <item.icon className={cn("h-5 w-5", item.color)} />
                    </CardHeader>
                    <CardContent>
                      <div className={cn("text-3xl font-bold", item.color)}>{item.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Task Trends (Coming Soon)</CardTitle>
                <CardDescription>Visualize your task creation vs. completion over time.</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-b-lg">
                <p className="text-muted-foreground italic">Line chart placeholder</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Priority Distribution (Coming Soon)</CardTitle>
                <CardDescription>How your tasks are distributed by priority level.</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-b-lg">
                <p className="text-muted-foreground italic">Pie chart placeholder</p>
              </CardContent>
            </Card>
          </div>

           <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" strokeWidth={1.5} />
            <p className="text-muted-foreground">
              More detailed analytics and customizable reports are under development.
            </p>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
