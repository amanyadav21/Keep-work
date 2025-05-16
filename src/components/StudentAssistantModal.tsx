
"use client";

import type { StudentAssistantOutput, ChatMessage } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Loader2, Type, Code, ListChecks, HelpCircle, AlertCircle, Send, UserCircle, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect, useRef } from 'react';
import { getStudentAssistance, type StudentAssistantInput } from '@/ai/flows/student-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StudentAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssistance: StudentAssistantOutput | null;
  isLoadingInitial: boolean;
  taskDescription: string | null;
}

const TaskTypeIcon: React.FC<{ type: StudentAssistantOutput['identifiedTaskType'] | undefined }> = ({ type }) => {
  if (!type) return <HelpCircle className="h-4 w-4" />;
  switch (type) {
    case 'writing': return <Type className="h-4 w-4" />;
    case 'coding': return <Code className="h-4 w-4" />;
    case 'planning_reminder': return <ListChecks className="h-4 w-4" />;
    case 'general_query': return <HelpCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

export function StudentAssistantModal({ isOpen, onClose, initialAssistance, isLoadingInitial, taskDescription }: StudentAssistantModalProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUserInput, setCurrentUserInput] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const latestIdentifiedType = useRef<StudentAssistantOutput['identifiedTaskType'] | undefined>(undefined);

  useEffect(() => {
    if (isOpen && taskDescription && initialAssistance && !isLoadingInitial) {
      latestIdentifiedType.current = initialAssistance.identifiedTaskType;
      setChatMessages([
        { role: 'user', content: taskDescription },
        { role: 'assistant', content: initialAssistance.assistantResponse }
      ]);
      setCurrentUserInput(""); 
    } else if (isOpen && taskDescription && isLoadingInitial) {
      setChatMessages([{ role: 'user', content: taskDescription }]);
      latestIdentifiedType.current = undefined;
    }
  }, [isOpen, taskDescription, initialAssistance, isLoadingInitial]);

  useEffect(() => {
    // Scroll to bottom when chatMessages change
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        // Defer scroll to end of event loop to allow DOM updates
        setTimeout(() => {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }, 0);
      }
    }
  }, [chatMessages]);


  const handleSendFollowUp = async () => {
    if (!currentUserInput.trim() || !taskDescription) return;

    const userMessage: ChatMessage = { role: 'user', content: currentUserInput };
    setChatMessages(prev => [...prev, userMessage]);
    const currentChatHistory = [...chatMessages, userMessage]; // Use updated history for the API call
    setCurrentUserInput("");
    setIsSendingFollowUp(true);

    try {
      const flowInput: StudentAssistantInput = {
        currentInquiry: userMessage.content,
        conversationHistory: chatMessages, // Send the history *before* adding the current user message for the AI
        originalTaskContext: taskDescription,
      };
      const result = await getStudentAssistance(flowInput);
      latestIdentifiedType.current = result.identifiedTaskType;
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.assistantResponse }]);
    } catch (error) {
      console.error("AI follow-up assistance error:", error);
      toast({
        title: "AI Follow-up Failed",
        description: "Could not get a follow-up response at this moment.",
        variant: "destructive",
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error trying to respond." }]);
    } finally {
      setIsSendingFollowUp(false);
    }
  };
  
  const handleCloseModal = () => {
    setChatMessages([]); 
    setCurrentUserInput("");
    latestIdentifiedType.current = undefined;
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl flex items-center">
            <Brain className="h-6 w-6 mr-2 text-primary" />
            AI Student Assistant
          </DialogTitle>
          {taskDescription && (
            <div className="mt-1 text-sm text-muted-foreground flex items-center justify-between">
              <div> 
                Original Task: <span className="font-medium text-foreground italic ml-1">"{taskDescription}"</span>
              </div>
              {latestIdentifiedType.current && (
                 <Badge variant="outline" className="capitalize text-xs"> 
                  <TaskTypeIcon type={latestIdentifiedType.current} />
                  <span className="ml-1.5">{latestIdentifiedType.current.replace('_', ' ')}</span>
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 space-y-4">
          {isLoadingInitial && chatMessages.length <=1 ? ( 
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Thinking...</p>
              <p className="text-sm text-muted-foreground">Your AI assistant is generating an initial response.</p>
            </div>
          ) : chatMessages.length > 0 ? (
            chatMessages.map((msg, index) => (
              <div key={index} className={cn("flex items-start space-x-3", msg.role === 'user' ? 'justify-end' : '')}>
                {msg.role === 'assistant' && <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-1" />}
                <div 
                  className={cn(
                    "prose prose-sm dark:prose-invert max-w-[85%] p-3 rounded-lg border",
                    msg.role === 'user' ? 'bg-primary/10 border-primary/20 text-primary-foreground' : 'bg-muted/50 border-muted'
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.role === 'user' && <UserCircle className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />}
              </div>
            ))
          ) : !isLoadingInitial && ( 
            <div className="text-center py-10 text-muted-foreground">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p>No assistance available or conversation started.</p>
            </div>
          )}
           {isSendingFollowUp && chatMessages.length > 0 && chatMessages[chatMessages.length -1].role === 'user' && ( 
            <div className="flex items-center space-x-3 py-2">
              <Bot className="h-6 w-6 text-primary flex-shrink-0 animate-pulse" />
              <div className="bg-muted/50 p-3 rounded-lg border border-muted text-sm text-muted-foreground italic w-fit">
                Assistant is typing... <Loader2 className="inline h-4 w-4 animate-spin ml-1" />
              </div>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t bg-background">
          <div className="flex items-start space-x-2">
            <Textarea
              placeholder="Ask a follow-up question..."
              value={currentUserInput}
              onChange={(e) => setCurrentUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendFollowUp();
                }
              }}
              rows={1}
              className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm"
              disabled={isSendingFollowUp || isLoadingInitial}
            />
            <Button 
              onClick={handleSendFollowUp} 
              disabled={!currentUserInput.trim() || isSendingFollowUp || isLoadingInitial}
              size="icon"
              className="h-10 w-10" 
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
        
        <DialogFooter className="p-4 pt-0 border-t sm:justify-between">
          <div className="text-xs text-muted-foreground">AI can make mistakes. Consider checking important information.</div>
          <Button onClick={handleCloseModal} variant="outline" size="sm">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

