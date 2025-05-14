
"use client";

import type { PrioritizedTaskSuggestion } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, ListChecks } from 'lucide-react';

interface PrioritySuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: PrioritizedTaskSuggestion[];
  isLoading: boolean;
}

export function PrioritySuggestionsModal({ isOpen, onClose, suggestions, isLoading }: PrioritySuggestionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-lg max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl flex items-center">
            <Lightbulb className="h-6 w-6 mr-2 text-primary" />
            AI Priority Suggestions
          </DialogTitle>
          <DialogDescription>
            Here are tasks our AI thinks you should focus on next.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 space-y-3 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <ListChecks className="h-12 w-12 text-muted-foreground animate-pulse mb-3" />
              <p className="text-muted-foreground">Analyzing your tasks...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="space-y-3">
              {suggestions.map((suggestion) => (
                <li key={suggestion.taskId} className="p-3 bg-muted/50 rounded-md border border-dashed">
                  <p className="font-semibold text-foreground break-words">{suggestion.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium text-primary">Reason:</span> {suggestion.reason}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No pending tasks to prioritize, or AI couldn't determine priorities.</p>
              <p className="text-sm mt-1">Add some tasks to get suggestions!</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4">
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
