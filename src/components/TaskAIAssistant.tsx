'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TaskAIAssistantProps {
  taskTitle: string;
  taskDescription?: string;
}

export function TaskAIAssistant({ taskTitle, taskDescription }: TaskAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAskAI = async () => {
    setIsLoading(true);
    setError('');
    setResponse('');
    
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription || '',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get AI response');
      }

      const data = await res.json();
      setResponse(data.response || '');
    } catch (err) {
      setError('Failed to get AI response. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setIsOpen(true);
          if (!response && !error) {
            handleAskAI();
          }
        }}
        className="gap-1"
      >
        <Sparkles className="h-4 w-4" />
        Ask AI
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Assistant</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Task:</p>
              <p className="text-sm font-semibold">{taskTitle}</p>
              {taskDescription && (
                <>
                  <p className="text-sm font-medium text-muted-foreground mt-2">Description:</p>
                  <p className="text-sm">{taskDescription}</p>
                </>
              )}
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {response && !isLoading && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm">{response}</p>
              </div>
            )}

            {!isLoading && !error && (
              <Button 
                onClick={handleAskAI}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
