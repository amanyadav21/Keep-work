import { GraduationCap } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface HeaderProps {
  onAddTask: () => void;
}

export function Header({ onAddTask }: HeaderProps) {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/60">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            TaskWise Student
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onAddTask} className="hidden sm:flex">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Task
          </Button>
          <Button onClick={onAddTask} size="icon" variant="outline" className="sm:hidden" aria-label="Add Task">
            <PlusCircle className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
