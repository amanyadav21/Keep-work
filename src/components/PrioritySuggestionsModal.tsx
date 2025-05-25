
"use client";

// This component is no longer used as AI task prioritization has been removed.
// You can delete this file.

import type { Task } from '@/types'; // PrioritizedTaskSuggestion removed
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, ListChecks, Loader2 } from 'lucide-react';

// PrioritizedTaskSuggestion type is no longer defined in types/index.ts
// interface PrioritizedTaskSuggestion {
//   taskId: string;
//   description: string;
//   reason: string;
// }

interface PrioritySuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // suggestions: PrioritizedTaskSuggestion[]; // This type would need to be defined locally if used
  suggestions: Array<{taskId: string, description: string, reason: string}>;
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
            AI task prioritization is currently unavailable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 space-y-3 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="h-12 w-12 text-muted-foreground animate-pulse mb-3" />
              <p className="text-muted-foreground">Analyzing your tasks...</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>AI task prioritization feature is not active.</p>
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
