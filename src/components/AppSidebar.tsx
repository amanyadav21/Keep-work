
"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle,
  LayoutDashboard,
  ListTodo,
  ListChecks,
  ListFilter,
  Users,
  Bell,
  Tag,
  Archive,
  Trash2,
  User,
  Settings as SettingsIcon,
  LogOut,
  GraduationCap,
  // Rocket, // Rocket icon is no longer used directly here
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';
import type { TaskFilter } from '@/types';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onAddTask: () => void;
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

interface NavItemConfig {
  href?: string;
  action?: () => void;
  label: string;
  icon: React.ElementType;
  tooltip: string;
  disabled?: boolean;
  filterValue?: TaskFilter;
  isFilter?: boolean;
  isPageLink?: boolean;
  isExternal?: boolean;
}

export function AppSidebar({ onAddTask, currentFilter, onFilterChange }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logOut, loading: authLoading } = useAuth();
  const { state: sidebarState, collapsible, isMobile, open: sidebarOpen } = useSidebar();
  
  const isIconOnly = !isMobile && sidebarState === 'collapsed' && collapsible === 'icon';

  const mainNavItems: NavItemConfig[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard', isPageLink: true },
  ];

  const filterNavItems: NavItemConfig[] = [
    { action: () => onFilterChange('all'), label: 'All Tasks', icon: ListFilter, tooltip: 'All Tasks', filterValue: 'all', isFilter: true },
    { action: () => onFilterChange('pending'), label: 'Pending Tasks', icon: ListTodo, tooltip: 'Pending Tasks', filterValue: 'pending', isFilter: true },
    { action: () => onFilterChange('completed'), label: 'Completed Tasks', icon: ListChecks, tooltip: 'Completed Tasks', filterValue: 'completed', isFilter: true },
  ];
  
  const categoryNavItems: NavItemConfig[] = [
    { href: '/classes', label: 'Class Section', icon: Users, tooltip: 'Class Section (Coming Soon)', disabled: true, isPageLink: true },
    { href: '/reminders', label: 'Reminders', icon: Bell, tooltip: 'Reminders (Coming Soon)', disabled: true, isPageLink: true },
    { href: '/labels', label: 'Labels', icon: Tag, tooltip: 'Labels (Coming Soon)', disabled: true, isPageLink: true },
    { href: '/archive', label: 'Archive', icon: Archive, tooltip: 'Archive (Coming Soon)', disabled: true, isPageLink: true },
  ];

  const managementNavItems: NavItemConfig[] = [
    { href: '/trash', label: 'Trash', icon: Trash2, tooltip: 'Trash', isPageLink: true },
    { href: '/settings', label: 'Settings', icon: SettingsIcon, tooltip: 'Settings', isPageLink: true },
  ];

  const renderNavItems = (items: NavItemConfig[], sectionTitle?: string) => {
    const sectionContent = (
      <>
        {sectionTitle && !isIconOnly && (
          <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase text-sidebar-foreground/70 tracking-wider">
            {sectionTitle}
          </div>
        )}
        <SidebarMenu>
          {items.map((item, index) => {
            const isActive = item.isFilter 
              ? item.filterValue === currentFilter && pathname === '/' // Filters only active on homepage
              : item.isPageLink ? pathname === item.href : false;
            
            const buttonContent = (
              <>
                <item.icon className={cn("h-5 w-5 shrink-0", isIconOnly ? 'mx-auto' : 'mr-3')} />
                {!isIconOnly && <span className="truncate">{item.label}</span>}
              </>
            );

            const menuButton = (
              <SidebarMenuButton
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start h-9 text-sm", 
                  isIconOnly ? '!p-0 flex items-center justify-center !h-9 !w-9 rounded-md' : 'px-2.5 py-1.5'
                )}
                onClick={item.action}
                disabled={item.disabled}
                isActive={isActive}
                aria-label={item.tooltip}
              >
                {buttonContent}
              </SidebarMenuButton>
            );

            return (
              <SidebarMenuItem key={`${item.label}-${index}`} className={isIconOnly ? 'flex justify-center' : ''}>
                {isIconOnly ? (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {item.href ? (
                          <Link href={item.href} className="block w-full h-full" target={item.isExternal ? "_blank" : "_self"}>
                            {menuButton}
                          </Link>
                        ) : (
                          menuButton
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <p>{item.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  item.href ? (
                    <Link href={item.href} className="block w-full h-full" target={item.isExternal ? "_blank" : "_self"}>
                      {menuButton}
                    </Link>
                  ) : (
                    menuButton
                  )
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </>
    );
    return sectionContent;
  };
  
  if (authLoading) {
    return (
      <Sidebar
        side="left"
        className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm"
        style={{
          "--sidebar-width": "16rem", 
          "--sidebar-width-icon": "4.5rem", 
        } as React.CSSProperties}
      >
        <SidebarHeader className="p-3 h-[60px] border-b border-sidebar-border flex items-center gap-2">
          <SidebarTrigger className="shrink-0" aria-label="Toggle Sidebar" />
           {!isIconOnly && (
            <div className="h-6 w-24 bg-muted rounded animate-pulse ml-2"></div>
          )}
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ScrollArea className="h-full w-full">
            <div className="p-2 space-y-1">
              <div className={cn("h-10 bg-muted rounded animate-pulse", isIconOnly ? "w-9 mx-auto" : "w-full")}></div>
              <SidebarSeparator/>
              {[...Array(3)].map((_, i) => <div key={i} className={cn("h-9 bg-muted rounded animate-pulse mt-1", isIconOnly ? "w-9 mx-auto" : "w-full")}></div>)}
              <SidebarSeparator/>
              {[...Array(4)].map((_, i) => <div key={i} className={cn("h-9 bg-muted rounded animate-pulse mt-1", isIconOnly ? "w-9 mx-auto" : "w-full")}></div>)}
            </div>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="p-3 border-t border-sidebar-border mt-auto">
           <div className={cn("h-10 bg-muted rounded animate-pulse", isIconOnly ? "w-9 mx-auto" : "w-full")}></div>
        </SidebarFooter>
      </Sidebar>
    );
  }
  
  if (!user) {
    return null; // Don't render sidebar if user is not logged in
  }

  const userInitial = user.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() 
    : user.email ? user.email[0].toUpperCase() : '?';

  return (
    <Sidebar
      side="left"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-all duration-300 ease-in-out"
      style={{
        "--sidebar-width": "16rem", 
        "--sidebar-width-icon": "3.5rem", 
      } as React.CSSProperties}
    >
      <SidebarHeader className="p-3 h-[60px] border-b border-sidebar-border flex items-center">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
               <SidebarTrigger className="shrink-0" aria-label="Toggle Sidebar" />
            </TooltipTrigger>
             <TooltipContent side="right" align="center"><p>Toggle Navigation</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!isIconOnly && (
          <Link href="/" className="flex items-center group overflow-hidden ml-2">
            {/* Rocket icon removed */}
            <h1 className="text-lg font-semibold text-sidebar-foreground tracking-tight group-hover:text-sidebar-foreground/90 transition-colors truncate">
              Upnext
            </h1>
          </Link>
        )}
        {/* Branding for icon-only mode removed as its only content (Rocket icon) was removed */}
      </SidebarHeader>

      <SidebarContent className="p-0"> 
        <ScrollArea className="h-full w-full">
          <div className="p-2 space-y-1"> 
            <SidebarMenu>
               <SidebarMenuItem className={isIconOnly ? 'flex justify-center' : ''}>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <SidebarMenuButton 
                          onClick={onAddTask} 
                          variant="primary"
                          className={cn(
                            "w-full justify-start h-10 text-base", 
                            isIconOnly ? '!p-0 flex items-center justify-center !h-9 !w-9 rounded-md' : 'px-2.5 py-1.5'
                          )}
                          aria-label="Add New Task"
                        >
                          <PlusCircle className={cn("h-5 w-5 shrink-0", isIconOnly ? 'mx-auto' : 'mr-3')} />
                          {!isIconOnly && <span className="truncate">Add New Task</span>}
                       </SidebarMenuButton>
                    </TooltipTrigger>
                    {isIconOnly && <TooltipContent side="right" align="center"><p>Add New Task</p></TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            </SidebarMenu>
            
            <SidebarSeparator />
            {renderNavItems(mainNavItems, 'Main')}
            {renderNavItems(filterNavItems, 'Filters')}
            <SidebarSeparator />
            {renderNavItems(categoryNavItems, 'Categories')}
            <SidebarSeparator />
            {renderNavItems(managementNavItems, 'Management')}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border mt-auto">
        <div className={cn(
          "flex items-center",
          isIconOnly ? 'w-full flex-col space-y-2' : 'justify-between w-full'
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-auto focus-visible:ring-sidebar-ring focus-visible:ring-offset-sidebar-background", 
                  isIconOnly 
                    ? '!p-0 flex items-center justify-center !h-9 !w-9 rounded-full' 
                    : 'px-2 py-1.5'
                )}
                aria-label="User Menu"
              >
                <Avatar className={cn("h-8 w-8 shrink-0", isIconOnly ? '' : 'mr-2')}>
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                {!isIconOnly && (
                  <div className="flex flex-col items-start truncate min-w-0">
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
            <DropdownMenuContent sideOffset={isIconOnly ? 10 : 5} side={isIconOnly ? "right" : "top"} align="start" className="w-56 mb-1 bg-popover text-popover-foreground">
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
            <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={isIconOnly ? 'flex justify-center w-full' : ''}>
                      <ThemeToggle />
                    </div>
                  </TooltipTrigger>
                  {isIconOnly && <TooltipContent side="right" align="center"><p>Toggle Theme</p></TooltipContent>}
                </Tooltip>
              </TooltipProvider>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

    