
"use client";

import { GraduationCap, PlusCircle, LogOut, UserCircle, Loader2, Brain } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface HeaderProps {
  onAddTask: () => void;
}

export function Header({ onAddTask }: HeaderProps) {
  const { user, logOut, loading: authLoading } = useAuth();

  return (
    <header className="py-4 px-4 md:px-6 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <GraduationCap className="h-7 w-7 text-primary group-hover:text-primary/90 transition-colors" />
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight group-hover:text-foreground/90 transition-colors">
            Upnext
          </h1>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          {authLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : user ? (
            <>
              <Button onClick={onAddTask} size="sm" className="rounded-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Task
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon" aria-label="AI Assistant">
                      <Link href="/ai-assistant">
                        <Brain className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI Assistant</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={logOut}
                      variant="ghost"
                      size="icon"
                      aria-label="Log out"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Log out ({user.email?.split('@')[0]})</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
