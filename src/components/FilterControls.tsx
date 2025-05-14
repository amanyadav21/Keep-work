
"use client";

import { Button } from '@/components/ui/button';
import type { TaskFilter } from '@/types';
import { ListFilter, ListChecks, ListTodo, CircleDot, Circle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Added import

interface FilterControlsProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

const filters: { value: TaskFilter; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All Tasks', icon: ListFilter },
  { value: 'pending', label: 'Pending', icon: ListTodo },
  { value: 'completed', label: 'Completed', icon: ListChecks },
];

export function FilterControls({ currentFilter, onFilterChange }: FilterControlsProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-start">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = currentFilter === filter.value;
        return (
          <Button
            key={filter.value}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "px-3 py-1.5 h-auto rounded-full transition-colors duration-150",
              isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            aria-pressed={isActive}
          >
            {isActive ? <CircleDot className="mr-2 h-4 w-4" /> : <Icon className="mr-2 h-4 w-4" />}
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
