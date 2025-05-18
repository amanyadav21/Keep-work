
"use client";

import { TaskStats } from '@/components/TaskStats';
import type { Task } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator, 
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutDashboard, BarChartBig, Activity, Brain } from 'lucide-react'; 
import { Card, CardContent } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AppSidebarProps {
  tasks: Task[];
  onSuggestPriorities: () => void;
  isPrioritizing: boolean;
}

export function AppSidebar({ tasks, onSuggestPriorities, isPrioritizing }: AppSidebarProps) {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-sidebar-primary" />
          <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden">
            Dashboard
          </h2>
        </div>
      </SidebarHeader>
      <SidebarSeparator/> 
      
      <SidebarContent className="p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            
            <div className="space-y-2">
              <div className="group-data-[state=expanded]:group-data-[collapsible=icon]:block group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-2 mb-2 px-1 text-sidebar-foreground/80">
                  <BarChartBig className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
                  <h3 className="text-md font-medium">
                    Performance
                  </h3>
                </div>
                <Card className="bg-sidebar-accent/50 border-sidebar-border shadow-sm">
                  <CardContent className="p-3">
                    <p className="text-sm text-sidebar-foreground/70">
                      Performance metrics and charts will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className={cn("hidden", "group-data-[state=collapsed]:group-data-[collapsible=icon]:flex group-data-[state=collapsed]:group-data-[collapsible=icon]:justify-center group-data-[state=collapsed]:group-data-[collapsible=icon]:py-1")}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sidebar-accent/70" aria-label="Performance">
                        <BarChartBig className="h-5 w-5 text-sidebar-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                      <p>Performance</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <SidebarSeparator />

            <div className="space-y-2">
              <div className="group-data-[state=expanded]:group-data-[collapsible=icon]:block group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-2 mb-2 px-1 text-sidebar-foreground/80">
                  <Activity className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
                  <h3 className="text-md font-medium">
                    Task Insights
                  </h3>
                </div>
                <TaskStats
                  tasks={tasks}
                  onSuggestPriorities={onSuggestPriorities}
                  isPrioritizing={isPrioritizing}
                />
              </div>
              <div className={cn("hidden", "group-data-[state=collapsed]:group-data-[collapsible=icon]:flex group-data-[state=collapsed]:group-data-[collapsible=icon]:justify-center group-data-[state=collapsed]:group-data-[collapsible=icon]:py-1")}>
                 <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sidebar-accent/70" aria-label="Task Insights">
                        <Activity className="h-5 w-5 text-sidebar-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                      <p>Task Insights</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
