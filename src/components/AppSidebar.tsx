
"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle,
  LayoutDashboard,
  ListFilter,
  ListTodo,
  ListChecks,
  Users,
  Bell,
  Tag,
  Archive,
  Trash2,
  User,
  Settings as SettingsIcon, // Renamed to avoid conflict
  LogOut,
  Rocket,
  PanelLeft,
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger, // Used for hamburger in sidebar header
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';
import type { TaskFilter } from '@/types';

interface AppSidebarProps {
  onAddTask: () => void;
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

interface NavItem {
  href?: string;
  action?: () => void;
  label: string;
  icon: React.ElementType;
  tooltip: string;
  disabled?: boolean;
  filterValue?: TaskFilter;
}

export function AppSidebar({ onAddTask, currentFilter, onFilterChange }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  const { state: sidebarState, collapsible } = useSidebar(); // Get sidebar state for conditional rendering
  const isIconOnly = sidebarState === 'collapsed' && collapsible === 'icon';

  const mainNavItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  ];

  const filterNavItems: NavItem[] = [
    { action: () => onFilterChange('all'), label: 'All Tasks', icon: ListFilter, tooltip: 'All Tasks', filterValue: 'all' },
    { action: () => onFilterChange('pending'), label: 'Pending Tasks', icon: ListTodo, tooltip: 'Pending Tasks', filterValue: 'pending' },
    { action: () => onFilterChange('completed'), label: 'Completed Tasks', icon: ListChecks, tooltip: 'Completed Tasks', filterValue: 'completed' },
  ];
  
  const categoriesNavItems: NavItem[] = [
    { href: '#!', label: 'Class Section', icon: Users, tooltip: 'Class Section', disabled: true },
    { href: '#!', label: 'Reminders', icon: Bell, tooltip: 'Reminders', disabled: true },
    { href: '#!', label: 'Labels', icon: Tag, tooltip: 'Labels', disabled: true },
    { href: '#!', label: 'Archive', icon: Archive, tooltip: 'Archive', disabled: true },
    { href: '/trash', label: 'Trash', icon: Trash2, tooltip: 'Trash' },
    { href: '/settings', label: 'Settings', icon: SettingsIcon, tooltip: 'Settings'},
  ];

  const renderNavItems = (items: NavItem[], isFilterGroup = false) => {
    return items.map((item, index) => {
      const isActive = item.href ? pathname === item.href : (isFilterGroup && item.filterValue === currentFilter);
      const buttonContent = (
        <>
          <item.icon className={`h-5 w-5 shrink-0 ${isIconOnly ? 'mx-auto' : 'mr-3'}`} />
          {!isIconOnly && <span className="truncate">{item.label}</span>}
        </>
      );

      const menuButton = (
        <SidebarMenuButton
          variant={isActive ? 'secondary' : 'ghost'}
          className={`w-full justify-start h-10 ${isIconOnly ? '!p-0 flex items-center justify-center h-10 w-10' : ''}`}
          onClick={item.action}
          disabled={item.disabled}
          isActive={isActive}
          aria-label={item.tooltip}
        >
          {buttonContent}
        </SidebarMenuButton>
      );

      return (
        <SidebarMenuItem key={index} className={isIconOnly ? 'flex justify-center' : ''}>
          {isIconOnly ? (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {item.href ? <Link href={item.href} className="block w-full h-full">{menuButton}</Link> : menuButton}
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            item.href ? <Link href={item.href} className="block w-full h-full">{menuButton}</Link> : menuButton
          )}
        </SidebarMenuItem>
      );
    });
  };
  
  if (!user) return null; // Don't render sidebar if no user

  const userInitial = user.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : user.email ? user.email[0].toUpperCase() : '?';

  return (
    <Sidebar
      side="left"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm" // Removed transition classes here
      style={{
        "--sidebar-width": "16rem", // 256px
        "--sidebar-width-icon": "4.5rem", // 72px
      } as React.CSSProperties}
    >
      <SidebarHeader className="p-3 h-[60px] border-b border-sidebar-border flex items-center gap-2">
        <SidebarTrigger className="shrink-0" tooltip={{ children: <p>Toggle Sidebar</p>, side: "right"}} />
        <Link href="/" className="flex items-center gap-2 group flex-grow min-w-0">
          <Rocket className={`h-7 w-7 text-primary group-hover:text-primary/90 transition-colors ${isIconOnly ? 'mx-auto' : ''}`} />
          {!isIconOnly && (
            <h1 className="text-xl font-semibold text-sidebar-foreground tracking-tight group-hover:text-sidebar-foreground/90 transition-colors truncate">
              Upnext
            </h1>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-0"> {/* Remove padding from content, apply to inner div in ScrollArea */}
        <ScrollArea className="h-full w-full">
          <div className="p-2 space-y-1"> {/* Padding for content inside ScrollArea */}
            <SidebarMenu>
               <SidebarMenuItem className={isIconOnly ? 'flex justify-center' : ''}>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <SidebarMenuButton 
                          onClick={onAddTask} 
                          className={`w-full justify-start h-10 text-base bg-primary text-primary-foreground hover:bg-primary/90 ${isIconOnly ? '!p-0 flex items-center justify-center h-10 w-10' : ''}`}
                          aria-label="Add New Task"
                        >
                          <PlusCircle className={`h-5 w-5 shrink-0 ${isIconOnly ? 'mx-auto' : 'mr-3'}`} />
                          {!isIconOnly && <span className="truncate">Add New Task</span>}
                       </SidebarMenuButton>
                    </TooltipTrigger>
                    {isIconOnly && <TooltipContent side="right" align="center"><p>Add New Task</p></TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            </SidebarMenu>
            
            <SidebarSeparator />
            <SidebarMenu>{renderNavItems(mainNavItems)}</SidebarMenu>
            <SidebarSeparator />
            <SidebarMenu>{renderNavItems(filterNavItems, true)}</SidebarMenu>
            <SidebarSeparator />

            {!isIconOnly && (
              <div className="px-3 py-2 text-xs font-semibold uppercase text-sidebar-foreground/70 tracking-wider">
                Categories
              </div>
            )}
            <SidebarMenu>{renderNavItems(categoriesNavItems)}</SidebarMenu>
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className={`${isIconOnly ? 'w-full flex justify-center' : 'flex items-center justify-between w-full'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-start h-12 ${isIconOnly ? '!p-0 flex items-center justify-center h-10 w-10 rounded-full' : 'px-2 py-1.5'}`}
                aria-label="User Menu"
              >
                <Avatar className={`h-8 w-8 ${isIconOnly ? '' : 'mr-2'}`}>
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                {!isIconOnly && (
                  <div className="flex flex-col items-start truncate">
                    <span className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-sidebar-foreground/70 truncate -mt-0.5">
                      View Profile
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 mb-2 ml-1">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              {/* Settings and Trash already in main nav, so removed from here to avoid duplication unless desired */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!isIconOnly && <ThemeToggle />}
          {isIconOnly && (
             <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div><ThemeToggle /></div>
                </TooltipTrigger>
                <TooltipContent side="right" align="center"><p>Toggle Theme</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
