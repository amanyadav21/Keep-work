
import { GraduationCap } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface HeaderProps {
  onAddTask: () => void;
}

export function Header({ onAddTask }: HeaderProps) {
  return (
    <header className="py-4 px-4 md:px-6 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="w-full flex justify-between items-center"> {/* Changed from container mx-auto */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-7 w-7 md:hidden" /> {/* Only show on mobile by default, or always if preferred */}
          <GraduationCap className="h-7 w-7 text-primary" />
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
            Upnext
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onAddTask} size="sm" className="rounded-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
