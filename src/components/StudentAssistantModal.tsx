
"use client";

import type { StudentAssistantOutput, ChatMessage } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Loader2, Type, Code, ListChecks, HelpCircle, AlertCircle, Send, UserCircle, Bot, ChevronDown, MessageSquareText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect, useRef } from 'react';
import { getStudentAssistance, type StudentAssistantInput } from '@/ai/flows/student-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  const latestIdentifiedType = useRef<StudentAssistantOutput['identifiedTaskType'] | undefined>(undefined);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };
  
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50; // Threshold of 50px
      setIsUserScrolledUp(!atBottom);
      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight + 50);
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [isOpen]);


  useEffect(() => {
    if (isOpen && taskDescription && initialAssistance && !isLoadingInitial) {
      latestIdentifiedType.current = initialAssistance.identifiedTaskType;
      setChatMessages([
        { role: 'user', content: taskDescription, timestamp: Date.now() },
        { role: 'assistant', content: initialAssistance.assistantResponse, timestamp: Date.now() }
      ]);
      setCurrentUserInput(""); 
    } else if (isOpen && taskDescription && isLoadingInitial) {
      setChatMessages([{ role: 'user', content: taskDescription, timestamp: Date.now() }]);
      latestIdentifiedType.current = undefined;
    } else if (!isOpen) { 
      setChatMessages([]);
      setCurrentUserInput("");
      latestIdentifiedType.current = undefined;
      setIsUserScrolledUp(false);
      setShowScrollToBottom(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialAssistance, isLoadingInitial]); // taskDescription removed to prevent re-init on taskDescription prop change if modal already open

  useEffect(() => {
    if (chatMessages.length > 0 && !isUserScrolledUp) {
      scrollToBottom("smooth");
    }
  }, [chatMessages, isUserScrolledUp]);


  const handleSendFollowUp = async () => {
    if (!currentUserInput.trim() || !taskDescription) return;

    const userMessage: ChatMessage = { role: 'user', content: currentUserInput, timestamp: Date.now() };
    const currentFollowUpQuery = currentUserInput;
    
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentUserInput(""); 
    setIsSendingFollowUp(true);
    setIsUserScrolledUp(false); // Assume user wants to see new messages

    try {
      const flowInput: StudentAssistantInput = {
        currentInquiry: currentFollowUpQuery,
        conversationHistory: chatMessages, 
        originalTaskContext: taskDescription,
      };
      const result = await getStudentAssistance(flowInput);
      latestIdentifiedType.current = result.identifiedTaskType;
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.assistantResponse, timestamp: Date.now() }]);
    } catch (error) {
      console.error("AI follow-up assistance error:", error);
      toast({
        title: "AI Follow-up Failed",
        description: "Could not get a follow-up response at this moment.",
        variant: "destructive",
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error trying to respond.", timestamp: Date.now() }]);
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const handleCloseModal = () => {
    onClose();
  }

  const isDisabled = isSendingFollowUp || isLoadingInitial || (!initialAssistance && !isLoadingInitial && chatMessages.length === 0 && !taskDescription);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b bg-background z-10 sticky top-0">
          <DialogTitle className="text-xl flex items-center">
            <Brain className="h-6 w-6 mr-2 text-primary" />
            AI Student Assistant
          </DialogTitle>
          {taskDescription && (
            <div className="text-muted-foreground mt-1 text-sm flex items-center justify-between">
              <div className="truncate pr-2">
                Original: <span className="font-medium text-foreground/90 italic ml-1">"{taskDescription}"</span>
              </div>
              {latestIdentifiedType.current && (
                 <Badge variant="outline" className="capitalize text-xs py-0.5 whitespace-nowrap">
                  <TaskTypeIcon type={latestIdentifiedType.current} />
                  <span className="ml-1.5">{latestIdentifiedType.current.replace('_', ' ')}</span>
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full" ref={scrollAreaRef}> 
            <div className="p-4 space-y-4">
              {isLoadingInitial && chatMessages.length <=1 && !initialAssistance && taskDescription ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p>Thinking...</p>
                  <p className="text-sm">Your AI assistant is generating an initial response.</p>
                </div>
              ) : chatMessages.length > 0 ? (
                chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-end space-x-2 w-full", 
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && <Bot className="h-6 w-6 text-primary flex-shrink-0 self-start mt-1" />}
                    <div
                      className={cn(
                        "prose prose-sm dark:prose-invert max-w-[85%] p-3 rounded-lg border text-sm text-foreground",
                        msg.role === 'user' 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-muted/50 border-muted'
                      )}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      <div className={cn("text-xs mt-1.5", msg.role === 'user' ? 'text-right' : 'text-left', 'text-muted-foreground/70')}>
                        {format(msg.timestamp, "p")}
                      </div>
                    </div>
                    {msg.role === 'user' && <UserCircle className="h-6 w-6 text-muted-foreground flex-shrink-0 self-start mt-1" />}
                  </div>
                ))
              ) : !isLoadingInitial && ( 
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center">
                  <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="font-medium">Start the conversation!</p>
                  <p className="text-xs">Ask the AI assistant for help with your task.</p>
                </div>
              )}
              {(isSendingFollowUp && chatMessages.length > 0 && chatMessages[chatMessages.length -1].role === 'user') && (
                <div className="flex items-end space-x-2 justify-start">
                  <Bot className="h-6 w-6 text-primary flex-shrink-0 mb-1 animate-pulse" />
                  <div className="bg-muted/50 p-3 rounded-lg border border-muted text-sm text-muted-foreground italic w-fit">
                    Assistant is typing... <Loader2 className="inline h-4 w-4 animate-spin ml-1" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} style={{ height: '1px' }} />
            </div>
          </ScrollArea>
          {showScrollToBottom && (
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-4 right-4 h-9 w-9 rounded-full shadow-md bg-background hover:bg-muted z-10"
              onClick={() => scrollToBottom('smooth')}
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="p-4 border-t bg-background"> 
          <div className="flex items-start space-x-2">
            <Textarea
              placeholder={chatMessages.length === 0 && !taskDescription ? "Enter your general inquiry here..." : "Ask a follow-up question..."}
              value={currentUserInput}
              onChange={(e) => setCurrentUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isDisabled && currentUserInput.trim()) handleSendFollowUp();
                }
              }}
              rows={1}
              className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm"
              disabled={isDisabled} 
            />
            <Button
              onClick={handleSendFollowUp}
              disabled={!currentUserInput.trim() || isDisabled}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              aria-label="Send follow-up question"
            >
              {isSendingFollowUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 pt-3 border-t sm:justify-between bg-background text-xs">
          <div className="text-muted-foreground">AI can make mistakes. Consider checking important information.</div>
          <Button onClick={handleCloseModal} variant="outline" size="sm">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

