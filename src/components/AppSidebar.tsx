
"use client";

import { TaskStats } from '@/components/TaskStats';
import type { Task } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator, // Import SidebarSeparator if you plan to use it between sections
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutDashboard, BarChartBig, Activity } from 'lucide-react'; // Added icons
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // For placeholder section

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
          <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Dashboard
          </h2>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="mx-2 my-0 w-auto bg-sidebar-border group-data-[collapsible=icon]:hidden" />
      
      <SidebarContent className="p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Performance Metrics Section (Placeholder) */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1 text-sidebar-foreground/80 group-data-[collapsible=icon]:justify-center">
                <BarChartBig className="h-5 w-5 text-sidebar-primary" />
                <h3 className="text-md font-medium group-data-[collapsible=icon]:hidden">
                  Performance
                </h3>
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <Card className="bg-sidebar-accent/50 border-sidebar-border shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-sidebar-foreground/70">
                      Performance metrics and charts will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </div>
               <div className="group-data-[collapsible=icon]:block hidden text-center py-2">
                 <BarChartBig className="h-5 w-5 text-sidebar-primary mx-auto" />
              </div>
            </div>

            <SidebarSeparator className="mx-0 my-0 w-full bg-sidebar-border group-data-[collapsible=icon]:hidden" />

            {/* Task Summary Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1 text-sidebar-foreground/80 group-data-[collapsible=icon]:justify-center">
                <Activity className="h-5 w-5 text-sidebar-primary" />
                <h3 className="text-md font-medium group-data-[collapsible=icon]:hidden">
                  Task Insights
                </h3>
              </div>
              <TaskStats
                tasks={tasks}
                onSuggestPriorities={onSuggestPriorities}
                isPrioritizing={isPrioritizing}
              />
               <div className="group-data-[collapsible=icon]:block hidden text-center py-2">
                <Activity className="h-5 w-5 text-sidebar-primary mx-auto" />
              </div>
            </div>
            
            {/* Future sections can be added here */}

          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
