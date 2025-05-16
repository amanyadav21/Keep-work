"use client";

import { TaskStats } from '@/components/TaskStats';
import type { Task } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutDashboard } from 'lucide-react';

interface AppSidebarProps {
  tasks: Task[];
  onSuggestPriorities: () => void;
  isPrioritizing: boolean;
}

export function AppSidebar({ tasks, onSuggestPriorities, isPrioritizing }: AppSidebarProps) {
  // Note: SidebarProvider is expected to be in layout.tsx
  // and SidebarTrigger is expected to be in Header.tsx.
  // This component defines the *content* of the sidebar.
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-sidebar-primary" />
          <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Summary & Insights
          </h2>
        </div>
      </SidebarHeader>
      <Separator className="mx-2 my-0 w-auto bg-sidebar-border group-data-[collapsible=icon]:hidden" />
      <SidebarContent className="p-0"> {/* Remove default padding from SidebarContent */}
        <ScrollArea className="h-full"> {/* ScrollArea for TaskStats if it gets long */}
          <div className="p-4"> {/* Add padding inside ScrollArea, around TaskStats */}
            <TaskStats
              tasks={tasks}
              onSuggestPriorities={onSuggestPriorities}
              isPrioritizing={isPrioritizing}
            />
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
