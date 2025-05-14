"use client";

import { Button } from '@/components/ui/button';
import type { TaskFilter } from '@/types';
import { ListFilter, ListChecks, ListTodo } from 'lucide-react';

interface FilterControlsProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

const filters: { value: TaskFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <ListFilter className="mr-2 h-4 w-4" /> },
  { value: 'pending', label: 'Pending', icon: <ListTodo className="mr-2 h-4 w-4" /> },
  { value: 'completed', label: 'Completed', icon: <ListChecks className="mr-2 h-4 w-4" /> },
];

export function FilterControls({ currentFilter, onFilterChange }: FilterControlsProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start py-4">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentFilter === filter.value ? 'default' : 'outline'}
          onClick={() => onFilterChange(filter.value)}
          className="flex-grow sm:flex-grow-0"
        >
          {filter.icon}
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
