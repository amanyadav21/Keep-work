
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { TaskFormValues } from './TaskForm';

interface AddTaskCardProps {
  onAddTask: (taskData: Pick<TaskFormValues, 'title' | 'description'>) => void;
  className?: string;
}

export function AddTaskCard({ onAddTask, className }: AddTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExpand = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      if (title) {
        // If there was pre-filled text (which becomes description), focus title.
        // Or if title was already being edited.
        titleInputRef.current?.focus();
      } else {
        // If title is empty, focus description.
        descriptionTextareaRef.current?.focus();
      }
    }
  }, [isExpanded, title]);


  const resetAndCollapse = useCallback(() => {
    setTitle('');
    setDescription('');
    setIsExpanded(false);
  }, []);

  const handleSaveAndCollapse = useCallback(() => {
    if (title.trim() || description.trim()) {
      onAddTask({ title: title.trim(), description: description.trim() });
    }
    resetAndCollapse();
  }, [title, description, onAddTask, resetAndCollapse]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        handleSaveAndCollapse();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, handleSaveAndCollapse]);

  useEffect(() => {
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = 'auto';
      const scrollHeight = descriptionTextareaRef.current.scrollHeight;
      const minHeight = 40; 
      descriptionTextareaRef.current.style.height = `${Math.max(scrollHeight, minHeight)}px`;
    }
  }, [description, isExpanded]);


  if (!isExpanded) {
    return (
      <div
        className={cn("max-w-2xl mx-auto mb-6", className)}
        ref={cardRef}
      >
        <Input
          type="text"
          placeholder="Take a note..."
          onClick={handleExpand}
          onFocus={handleExpand}
          value={description} 
          onChange={(e) => {
            setDescription(e.target.value); 
            if (!isExpanded && e.target.value.trim() !== "") {
                handleExpand();
            } else if (!isExpanded && e.target.value.trim() === "") {
                // If user focuses and types then deletes all text while still in "collapsed" input
                // do nothing extra, they can click away to truly collapse or keep typing.
            }
          }}
          className="w-full h-12 px-4 py-3 text-base bg-card text-foreground/80 border border-border rounded-lg shadow hover:shadow-lg transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-background cursor-text"
        />
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "max-w-2xl mx-auto mb-6 p-4 bg-card rounded-xl shadow-xl border border-border/70 focus-within:border-primary/70 focus-within:shadow-2xl transition-all duration-200 ease-out",
        className
      )}
    >
      <Input
        ref={titleInputRef}
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-lg font-medium border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 h-auto placeholder:text-muted-foreground/80 mb-1"
      />
      <Textarea
        ref={descriptionTextareaRef}
        placeholder="Take a note..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full text-sm border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 min-h-[40px] resize-none placeholder:text-muted-foreground/70"
        rows={1}
      />
      <div className="flex justify-end mt-3">
        <Button
          variant="ghost"
          onClick={handleSaveAndCollapse}
          className="text-sm text-foreground hover:bg-muted px-4 py-2 h-auto"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

