
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
  GraduationCap, // Keep for consistency with Header if needed, or remove if specific to old sidebar
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
import type { TaskFilter } from '@/types'; // Keep TaskFilter if used for navigation items
import { cn } from '@/lib/utils';


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
  filterValue?: TaskFilter; // For items that act as filters
  isFilter?: boolean; // To distinguish filter items
}

export function AppSidebar({ onAddTask, currentFilter, onFilterChange }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  const { state: sidebarState, collapsible, isMobile } = useSidebar(); // Get sidebar state for conditional rendering
  const isIconOnly = !isMobile && sidebarState === 'collapsed' && collapsible === 'icon';

  const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
    { action: () => onFilterChange('all'), label: 'All Tasks', icon: ListFilter, tooltip: 'All Tasks', filterValue: 'all', isFilter: true },
    { action: () => onFilterChange('pending'), label: 'Pending Tasks', icon: ListTodo, tooltip: 'Pending Tasks', filterValue: 'pending', isFilter: true },
    { action: () => onFilterChange('completed'), label: 'Completed Tasks', icon: ListChecks, tooltip: 'Completed Tasks', filterValue: 'completed', isFilter: true },
    { href: '/classes', label: 'Class Section', icon: Users, tooltip: 'Class Section (Coming Soon)', disabled: true },
    { href: '/reminders', label: 'Reminders', icon: Bell, tooltip: 'Reminders (Coming Soon)', disabled: true },
    { href: '/labels', label: 'Labels', icon: Tag, tooltip: 'Labels (Coming Soon)', disabled: true },
    { href: '/archive', label: 'Archive', icon: Archive, tooltip: 'Archive (Coming Soon)', disabled: true },
    { href: '/trash', label: 'Trash', icon: Trash2, tooltip: 'Trash' },
    { href: '/profile', label: 'Profile', icon: User, tooltip: 'Profile' },
    { href: '/settings', label: 'Settings', icon: SettingsIcon, tooltip: 'Settings'},
  ];

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item, index) => {
      const isActive = item.isFilter ? item.filterValue === currentFilter : item.href ? pathname === item.href : false;
      
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
            "w-full justify-start h-10", 
            isIconOnly ? '!p-0 flex items-center justify-center h-10 w-10' : ''
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
  
  if (!user) return null; 

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
             <TooltipContent side="right" align="center"><p>Toggle Sidebar</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* Removed Upnext logo and text from here */}
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
                            isIconOnly ? '!p-0 flex items-center justify-center h-10 w-10' : ''
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
            
            <SidebarMenu>{renderNavItems(navItems.filter(item => !item.isFilter && ['/', '/classes', '/reminders'].includes(item.href || '')))}</SidebarMenu>
            
            {!isIconOnly && (
              <div className="px-3 py-2 mt-2 text-xs font-semibold uppercase text-sidebar-foreground/70 tracking-wider">
                Filters
              </div>
            )}
            <SidebarMenu>{renderNavItems(navItems.filter(item => item.isFilter))}</SidebarMenu>
            
            <SidebarSeparator />
            
            {!isIconOnly && (
              <div className="px-3 py-2 mt-2 text-xs font-semibold uppercase text-sidebar-foreground/70 tracking-wider">
                Categories
              </div>
            )}
            <SidebarMenu>{renderNavItems(navItems.filter(item => !item.isFilter && ['/labels', '/archive'].includes(item.href || '')))}</SidebarMenu>

            <SidebarSeparator />
            <SidebarMenu>{renderNavItems(navItems.filter(item => !item.isFilter && ['/trash', '/profile', '/settings'].includes(item.href || '')))}</SidebarMenu>

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
                  "w-full justify-start h-auto", 
                  isIconOnly 
                    ? '!p-0 flex items-center justify-center h-10 w-10 rounded-full' 
                    : 'px-2 py-1.5'
                )}
                aria-label="User Menu"
              >
                <Avatar className={cn("h-8 w-8", isIconOnly ? '' : 'mr-2')}>
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
            <DropdownMenuContent sideOffset={isIconOnly ? 10 : 5} side={isIconOnly ? "right" : "top"} align="start" className="w-56 mb-1">
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
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full cursor-pointer flex items-center">
                  <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/trash" className="w-full cursor-pointer flex items-center">
                  <Trash2 className="mr-2 h-4 w-4" /> Trash
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                <LogOut className="mr-2 h-4 w-4" /> <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className={isIconOnly ? 'mt-2' : ''}>
            <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div><ThemeToggle /></div>
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
