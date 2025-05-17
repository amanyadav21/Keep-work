
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

interface AppSidebarProps {
  tasks: Task[];
  onSuggestPriorities: () => void;
  isPrioritizing: boolean;
  onOpenAIAssistant: () => void; // New prop
}

export function AppSidebar({ tasks, onSuggestPriorities, isPrioritizing, onOpenAIAssistant }: AppSidebarProps) {
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
            {/* Performance Metrics Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1 text-sidebar-foreground/80 group-data-[collapsible=icon]:justify-center">
                <BarChartBig className="h-5 w-5 text-sidebar-primary" />
                <h3 className="text-md font-medium group-data-[collapsible=icon]:hidden">
                  Performance
                </h3>
              </div>
              {/* Content for expanded view */}
              <div className="group-data-[collapsible=icon]:hidden">
                <Card className="bg-sidebar-accent/50 border-sidebar-border shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-sidebar-foreground/70">
                      Performance metrics and charts will be displayed here.
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* Icon for collapsed view */}
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
              {/* Content for expanded view */}
              <div className="group-data-[collapsible=icon]:hidden">
                <TaskStats
                  tasks={tasks}
                  onSuggestPriorities={onSuggestPriorities}
                  isPrioritizing={isPrioritizing}
                />
              </div>
              {/* Icon for collapsed view */}
               <div className="group-data-[collapsible=icon]:block hidden text-center py-2">
                <Activity className="h-5 w-5 text-sidebar-primary mx-auto" />
              </div>
            </div>

            <SidebarSeparator className="mx-0 my-0 w-full bg-sidebar-border group-data-[collapsible=icon]:hidden" />

            {/* AI Assistant Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1 text-sidebar-foreground/80 group-data-[collapsible=icon]:justify-center">
                <Brain className="h-5 w-5 text-sidebar-primary" />
                <h3 className="text-md font-medium group-data-[collapsible=icon]:hidden">
                  AI Assistant
                </h3>
              </div>
              {/* Content for expanded view */}
              <div className="group-data-[collapsible=icon]:hidden">
                <Button 
                  variant="outline" 
                  className="w-full border-sidebar-border hover:bg-sidebar-accent/70" 
                  onClick={onOpenAIAssistant}
                >
                  Chat with AI
                </Button>
              </div>
              {/* Icon for collapsed view */}
               <div className="group-data-[collapsible=icon]:block hidden text-center py-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onOpenAIAssistant} 
                        className="mx-auto hover:bg-sidebar-accent/70"
                        aria-label="Open AI Assistant"
                      >
                        <Brain className="h-5 w-5 text-sidebar-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                      <p>AI Assistant</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {/* Future sections can be added here */}

          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
