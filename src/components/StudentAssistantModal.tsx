
"use client";

import type { StudentAssistantOutput } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, Type, Code, ListChecks, HelpCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudentAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistance: StudentAssistantOutput | null;
  isLoading: boolean;
  taskDescription?: string | null;
}

const TaskTypeIcon: React.FC<{ type: StudentAssistantOutput['identifiedTaskType'] }> = ({ type }) => {
  switch (type) {
    case 'writing': return <Type className="h-4 w-4" />;
    case 'coding': return <Code className="h-4 w-4" />;
    case 'planning_reminder': return <ListChecks className="h-4 w-4" />;
    case 'general_query': return <HelpCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

export function StudentAssistantModal({ isOpen, onClose, assistance, isLoading, taskDescription }: StudentAssistantModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-xl flex items-center">
            <Brain className="h-6 w-6 mr-2 text-primary" />
            AI Assistant
          </DialogTitle>
          {taskDescription && (
            <DialogDescription className="mt-1 text-sm">
              Assistance for: <span className="font-medium text-foreground italic">"{taskDescription}"</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Thinking...</p>
              <p className="text-sm text-muted-foreground">Your AI assistant is generating a response.</p>
            </div>
          ) : assistance ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Identified Task Type:</span>
                <Badge variant="outline" className="capitalize">
                  <TaskTypeIcon type={assistance.identifiedTaskType} />
                  <span className="ml-1.5">{assistance.identifiedTaskType.replace('_', ' ')}</span>
                </Badge>
              </div>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-4 rounded-md border"
                style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} // Ensures pre-wrap for markdown-like content
              >
                {assistance.assistantResponse}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p>No assistance available at the moment.</p>
              <p className="text-sm">The AI might be processing or encountered an issue.</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4 border-t">
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
