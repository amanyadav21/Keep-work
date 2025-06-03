
"use client";

import { GraduationCap, PlusCircle, LogOut, UserCircle, User, Settings, Trash2, Rocket, Brain } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle'; // Will be moved to AppSidebar
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'; // Import SidebarTrigger
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  // onAddTask prop removed as it's no longer used
}

export function Header({}: HeaderProps) { // onAddTask removed from destructuring
  const { user, logOut, loading: authLoading } = useAuth();
  const { isMobile, isMobileSheetOpen, effectiveSidebarWidth } = useSidebar(); // Get sidebar context

  const userInitial = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : user?.email ? user.email[0].toUpperCase() : '?';

  return (
    // Header is sticky *within* the MainContentWrapper which has dynamic margin-left
    <header className="sticky top-0 z-30 py-3 px-4 md:px-6 border-b bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* SidebarTrigger is now in AppSidebar's header by default, but can be placed here if design requires */}
          {/* If you want it here, ensure AppSidebar doesn't also render one to avoid duplicates */}
           {isMobile && user && <SidebarTrigger />} 
          <Link href="/" className="flex items-center gap-2 group">
            {/* Logo/Title could be simplified if also present in sidebar header */}
            <GraduationCap className="h-7 w-7 text-primary group-hover:text-primary/90 transition-colors" />
            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight group-hover:text-foreground/90 transition-colors">
              Upnext
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {authLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              {/* Add Task button moved to AppSidebar */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                      <Link href="/ai-assistant" aria-label="Open AI Assistant">
                        <Brain className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI Assistant</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Open user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
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
                       <Settings className="mr-2 h-4 w-4" /> <span>Settings</span>
                     </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/trash" className="w-full cursor-pointer flex items-center">
                      <Trash2 className="mr-2 h-4 w-4" /> <span>Trash</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* ThemeToggle moved to AppSidebar */}
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">Sign Up</Link>
              </Button>
               <ThemeToggle /> {/* Show theme toggle even if not logged in */}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
