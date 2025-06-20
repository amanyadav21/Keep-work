
"use client";

import { usePathname, useRouter }
from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle,
  LayoutDashboard,
  ListTodo,
  ListChecks,
  Users,
  Tag,
  Trash2,
  User,
  Settings as SettingsIcon,
  LogOut,
  CalendarClock, // For "Today" filter
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useAuth } from '@/contexts/AuthContext';
import type { TaskFilter, Label } from '@/types';
import { cn } from '@/lib/utils';
import { db } from '@/firebase/config';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  const { user, logOut, loading: authLoading } = useAuth();
  const { state: sidebarState, collapsible, isMobile, open: sidebarOpen } = useSidebar();
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

  const categoryNavItems: NavItemConfig[] = [
    { href: '/classes', label: 'Class Section', icon: Users, tooltip: 'Class Section (Coming Soon)', disabled: true, isPageLink: true },
    { href: '/reminders', label: 'Reminders', icon: AlarmClock, tooltip: 'View Reminders', disabled: false, isPageLink: true },
    { href: '/performance', label: 'Performance', icon: BarChart3, tooltip: 'Performance Overview', disabled: false, isPageLink: true },
    // "Labels" as a page link removed, labels are now listed directly
  ];

  const managementNavItems: NavItemConfig[] = [
    { href: '/trash', label: 'Trash', icon: Trash2, tooltip: 'Trash', isPageLink: true },
    { href: '/settings', label: 'Settings', icon: SettingsIcon, tooltip: 'Settings', isPageLink: true },
  ];

  const renderNavItems = (items: NavItemConfig[], sectionTitle?: string) => {
    const sectionContent = (
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

            const buttonContent = (
              <>
                <span className="flex items-center flex-grow overflow-hidden mr-1">
                  {labelDisplayContent}
                </span>
                 {/* Dropdown is only for expanded labels, so not here */}
              </>
            );
            
            const commonButtonProps = {
              variant: "ghost" as const,
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

            const menuButton = (
              <SidebarMenuButton {...commonButtonProps}>
                {buttonContent}
              </SidebarMenuButton>
            );
          }


            return (
              <SidebarMenuItem key={`${item.label}-${index}`} className={cn(
                isIconOnly ? 'flex justify-center' : 'group/menu-item',
              )}>
                {item.href || item.action ? (
                  item.href ? (
                    <Link href={linkPath} className="block w-full h-full" target={item.isExternal ? "_blank" : "_self"} passHref>
                      {menuButtonElement}
                    </Link>
                  ) : (
                    menuButtonElement
                  )
                ) : (
                   <div className={cn("flex w-full items-center gap-2 overflow-hidden rounded-md px-2.5 py-1.5 text-left text-sm outline-none ring-ring transition-colors focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50", sidebarMenuButtonVariants({variant: commonButtonProps.variant}), commonButtonProps.className)} aria-disabled={item.disabled} role="button" tabIndex={item.disabled ? -1 : 0}>
                    {buttonContent}
                   </div>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </>
    );
  };


  if (authLoading) {
    return (
      <Sidebar side="left" className="shadow-sm animate-pulse">
        <SidebarHeader>
           <div className={cn("h-7 w-7 bg-muted rounded-md shrink-0", isIconOnly && "mx-auto")}></div>
           {!isIconOnly && (<div className="h-6 w-24 bg-muted rounded animate-pulse ml-1"></div>)}
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ScrollArea className="h-full w-full p-2">
            <div className={cn("flex-1", isIconOnly ? "space-y-2 flex flex-col items-center" : "space-y-1")}>
              {[...Array(5)].map((_, i) => <div key={i} className={cn("h-9 bg-muted rounded mt-1", isIconOnly ? "w-9" : "w-full")}></div>)}
              <SidebarSeparator />
              {[...Array(4)].map((_, i) => <div key={i} className={cn("h-9 bg-muted rounded mt-1", isIconOnly ? "w-9" : "w-full")}></div>)}
              <SidebarSeparator />
              {[...Array(2)].map((_, i) => <div key={i} className={cn("h-9 bg-muted rounded mt-1", isIconOnly ? "w-9" : "w-full")}></div>)}
            </div>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className={cn(isIconOnly && "items-center")}>
           <div className={cn("h-10 bg-muted rounded", isIconOnly ? "w-9" : "w-full")}></div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  if (!user) {
    return null;
  }

  const userInitial = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()
    : user.email ? user.email[0].toUpperCase() : '?';

  const userMenuButton = (
    <Button
      variant="ghost"
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background text-foreground hover:bg-muted",
        isIconOnly
          ? 'p-0 flex items-center justify-center h-9 w-9 rounded-full'
          : 'px-2 py-1.5 h-auto w-full justify-start'
      )}
      aria-label="User Menu"
    >
      <Avatar className={cn("h-8 w-8 shrink-0", isIconOnly ? '' : 'mr-2')}>
        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
        <AvatarFallback className="bg-muted text-muted-foreground">{userInitial}</AvatarFallback>
      </Avatar>
      {!isIconOnly && (
        <div className="flex flex-col items-start truncate min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {user.displayName || user.email?.split('@')[0]}
          </span>
          <span className="text-xs text-muted-foreground truncate -mt-0.5">
            View Profile
          </span>
        </div>
      )}
    </Button>
  );

  return (
    <Sidebar
      side="left"
      className="shadow-sm"
    >
      <SidebarHeader className="flex items-center min-w-0">
        <SidebarTrigger className="shrink-0" tooltip="Toggle Sidebar" />
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
            {renderNavItems(filterNavItems, isIconOnly ? undefined : 'Filters')}
            <SidebarSeparator />
            {renderNavItems(categoryNavItems)}

            <SidebarSeparator />
            {renderNavItems(managementNavItems)}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className={cn(isIconOnly && "flex-col items-center")}>
        <div className={cn(
          "flex items-center",
          isIconOnly ? 'w-full flex-col space-y-2' : 'justify-between w-full'
        )}>
          <DropdownMenu>
            {isIconOnly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>{userMenuButton}</DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  <p>{user.displayName || user.email?.split('@')[0] || "Account options"}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <DropdownMenuTrigger asChild>{userMenuButton}</DropdownMenuTrigger>
            )}
            <DropdownMenuContent sideOffset={isIconOnly ? 10 : 5} side={isIconOnly ? "right" : "top"} align="start" className="w-60 mb-1 bg-popover text-popover-foreground">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" /> <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full cursor-pointer flex items-center">
                  <SettingsIcon className="mr-2 h-4 w-4" /> <span>Settings</span>
                </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/trash" className="w-full cursor-pointer flex items-center">
                  <Trash2 className="mr-2 h-4 w-4" /> <span>Trash</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                <LogOut className="mr-2 h-4 w-4" /> <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className={isIconOnly ? 'mt-0' : ''}>
             {isIconOnly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ThemeToggle />
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  <p>Toggle Theme</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <ThemeToggle />
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
