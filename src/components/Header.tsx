
import { GraduationCap, Edit } from 'lucide-react'; // Edit can be an alternative to PlusCircle
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface HeaderProps {
  onAddTask: () => void;
}

export function Header({ onAddTask }: HeaderProps) {
  return (
    <header className="py-4 px-4 md:px-6 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
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
