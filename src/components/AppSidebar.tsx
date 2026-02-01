"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  PlusCircle,
  LayoutDashboard,
  ListTodo,
  ListChecks,
  Users,
  Trash2,
  Settings as SettingsIcon,
  CalendarClock,
  Inbox,
  AlarmClock,
  BarChart3,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TaskFilter, Label } from '@/types';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onAddTask: () => void; 
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  selectedLabelId: string | null;
  onLabelSelect: (labelId: string | null) => void;
}

interface NavItemConfig {
  href?: string;
  action?: () => void;
  label: string;
  icon: React.ElementType;
  tooltip: string;
  disabled?: boolean;
  isPageLink?: boolean;
  isExternal?: boolean;
  isFilter?: boolean; 
  filterName?: TaskFilter; 
}

export function AppSidebar({ onAddTask, currentFilter, onFilterChange, selectedLabelId, onLabelSelect }: AppSidebarProps) {
  const pathname = usePathname();
  const { state: sidebarState, collapsible, isMobile } = useSidebar();
  const router = useRouter();

  const isIconOnly = !isMobile && sidebarState === 'collapsed' && collapsible === 'icon';

  const mainNavItems: NavItemConfig[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard', isPageLink: true },
  ];

  const filterNavItems: NavItemConfig[] = [
    { action: () => { onFilterChange('general'); onLabelSelect(null); }, label: 'General', icon: Inbox, tooltip: 'General Tasks', isFilter: true, filterName: 'general' },
    { action: () => { onFilterChange('today'); onLabelSelect(null); }, label: 'Today', icon: CalendarClock, tooltip: 'Tasks Due Today', isFilter: true, filterName: 'today' },
    { action: () => { onFilterChange('pending'); onLabelSelect(null); }, label: 'Pending Tasks', icon: ListTodo, tooltip: 'Pending Tasks', isFilter: true, filterName: 'pending' },
    { action: () => { onFilterChange('completed'); onLabelSelect(null);}, label: 'Completed Tasks', icon: ListChecks, tooltip: 'Completed Tasks', isFilter: true, filterName: 'completed' },
  ];

  const categoryNavItems: NavItemConfig[] = [];

  const managementNavItems: NavItemConfig[] = [];

  const renderNavItems = (items: NavItemConfig[], sectionTitle?: string) => {
    return (
      <>
        {sectionTitle && !isIconOnly && (
          <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase text-muted-foreground/70 tracking-wider">
            {sectionTitle}
          </div>
        )}
        <SidebarMenu className={cn(isIconOnly && "w-auto")}>
          {items.map((item, index) => {
            let isActive = false;
            if (item.isPageLink) {
              isActive = pathname === item.href;
            } else if (item.isFilter) {
              isActive = currentFilter === item.filterName;
            }

            const Icon = item.icon;
            
            const buttonContent = (
              <>
                <Icon className={cn("h-5 w-5 shrink-0", isIconOnly ? "" : "mr-2")} />
                {!isIconOnly && <span className="truncate">{item.label}</span>}
              </>
            );
            
            const commonButtonProps = {
              variant: (isActive ? "secondary" : "ghost") as "secondary" | "ghost" | "default", 
              size: isIconOnly ? 'icon' : 'default' as const,
              className: cn(
                isIconOnly ? "" : "w-full justify-start",
                isActive ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted" 
              ),
              onClick: item.action,
              disabled: item.disabled,
              isActive: isActive, 
              "aria-label": item.tooltip,
              tooltip: item.tooltip,
            };

            return (
              <SidebarMenuItem key={`${item.label}-${index}`} className={cn(
                isIconOnly ? 'flex justify-center' : 'group/menu-item',
              )}>
                {item.href ? (
                  <SidebarMenuButton {...commonButtonProps} asChild>
                    <Link href={item.href} className="block w-full" target={item.isExternal ? "_blank" : "_self"}>
                      {buttonContent}
                    </Link>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton {...commonButtonProps}>
                    {buttonContent}
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </>
    );
  };

  return (
    <Sidebar
      side="left"
      className="shadow-sm"
    >
      <SidebarHeader className="flex items-center min-w-0">
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-2 group">
            {!isIconOnly && <span className="font-bold text-sm">Upnext</span>}
          </div>
          <SidebarTrigger className="shrink-0" tooltip="Toggle Sidebar" />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0">
        <ScrollArea className="h-full w-full p-2">
          <div className={cn("flex-1", isIconOnly ? "space-y-2 flex flex-col items-center" : "space-y-1")}>
            <SidebarMenu className={cn(isIconOnly && "w-auto")}>
               <SidebarMenuItem className={isIconOnly ? 'flex justify-center' : ''}>
                  <SidebarMenuButton
                    onClick={onAddTask}
                    variant="primary"
                    size={isIconOnly ? "icon" : "lg"}
                    className={cn(isIconOnly ? "" : "w-full justify-start h-10 text-base")}
                    tooltip="Add New Task"
                  >
                    <PlusCircle className="h-5 w-5 shrink-0" />
                    {!isIconOnly && <span className="truncate">Add New Task</span>}
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator/>
            {renderNavItems(mainNavItems, isIconOnly ? undefined : 'Main')}
            <SidebarSeparator />
            {renderNavItems(filterNavItems, isIconOnly ? undefined : 'Upnext')}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className={cn(isIconOnly && "flex-col items-center")}>
        <div className={cn(
          "flex items-center",
          isIconOnly ? 'w-full flex-col space-y-2' : 'justify-center w-full p-2'
        )}>
           <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
