
"use client";

import type { StudentAssistantOutput, ChatMessage } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Loader2, Type, Code, ListChecks, HelpCircle, AlertCircle, Send, UserCircle, Bot, ChevronDown, MessageSquareText, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getStudentAssistance, type StudentAssistantInput } from '@/ai/flows/student-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface StudentAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssistance: StudentAssistantOutput | null;
  isLoadingInitial: boolean;
  taskDescription: string | null; // Can be null if opened for general inquiry
}

const TaskTypeIcon: React.FC<{ type: StudentAssistantOutput['identifiedTaskType'] | undefined }> = ({ type }) => {
  if (!type) return <HelpCircle className="h-4 w-4" />;
  switch (type) {
    case 'writing': return <Type className="h-4 w-4" />;
    case 'coding': return <Code className="h-4 w-4" />;
    case 'planning_reminder': return <ListChecks className="h-4 w-4" />;
    case 'general_query': return <HelpCircle className="h-4 w-4" />;
    case 'brainstorming_elaboration': return <Lightbulb className="h-4 w-4" />;
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

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);
  
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      if (!viewport) return;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50; 
      setIsUserScrolledUp(!atBottom);
      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight + 50);
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [isOpen]);


  useEffect(() => {
    if (isOpen) {
      const firstUserMessageContent = taskDescription || "How can I help you today?";
      const firstUserMessage: ChatMessage = { role: 'user', content: firstUserMessageContent, timestamp: Date.now() };
      
      if (initialAssistance && !isLoadingInitial) {
        latestIdentifiedType.current = initialAssistance.identifiedTaskType;
        setChatMessages([
          firstUserMessage,
          { role: 'assistant', content: initialAssistance.assistantResponse, timestamp: Date.now() }
        ]);
      } else if (isLoadingInitial) {
        setChatMessages([firstUserMessage]);
        latestIdentifiedType.current = undefined;
      } else { 
        setChatMessages([firstUserMessage]); 
        latestIdentifiedType.current = undefined;
      }
      setCurrentUserInput("");
      setIsUserScrolledUp(false); 
      setShowScrollToBottom(false);
      setTimeout(() => scrollToBottom("smooth"), 100); 
    } else { 
      setChatMessages([]);
      setCurrentUserInput("");
      latestIdentifiedType.current = undefined;
      setIsUserScrolledUp(false);
      setShowScrollToBottom(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialAssistance, isLoadingInitial, taskDescription, scrollToBottom]);

  useEffect(() => {
    if (chatMessages.length > 0 && !isUserScrolledUp && isOpen) { 
      setTimeout(() => scrollToBottom("smooth"), 100);
    }
  }, [chatMessages, isUserScrolledUp, isOpen, scrollToBottom]);


  const handleSendFollowUp = async (inquiry?: string) => {
    const currentFollowUpQuery = inquiry || currentUserInput;
    if (!currentFollowUpQuery.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: currentFollowUpQuery, timestamp: Date.now() };
    
    setChatMessages(prev => [...prev, userMessage]);
    if (!inquiry) { // Only clear input if it wasn't a programmatic inquiry (like from a button)
        setCurrentUserInput(""); 
    }
    setIsSendingFollowUp(true);
    setIsUserScrolledUp(false); 

    try {
      const historyForAI = chatMessages.filter(msg => msg.role !== 'user' || msg.content !== (taskDescription || "How can I help you today?"));

      const flowInput: StudentAssistantInput = {
        currentInquiry: currentFollowUpQuery,
        conversationHistory: historyForAI.length > 0 ? historyForAI : [],
        originalTaskContext: taskDescription || (chatMessages[0]?.role === 'user' ? chatMessages[0].content : "General Inquiry"),
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

  const handleBrainstormRequest = () => {
    if (taskDescription && taskDescription !== "How can I help you today?" && taskDescription !== "General Inquiry") {
      handleSendFollowUp(`Help me brainstorm ideas for: "${taskDescription}"`);
    } else if (chatMessages.length > 0) {
      // If no specific task desc, try to brainstorm based on the last user message or general context
      const lastUserMessage = [...chatMessages].reverse().find(msg => msg.role === 'user');
      const contextForBrainstorm = lastUserMessage ? lastUserMessage.content : "the current topic";
      handleSendFollowUp(`Help me brainstorm ideas for: "${contextForBrainstorm}"`);
    }
  };


  const handleCloseModal = () => {
    onClose();
  }

  const isEssentiallyLoading = isLoadingInitial || isSendingFollowUp;
  const canSendMessage = currentUserInput.trim() && !isEssentiallyLoading && (taskDescription || chatMessages.length > 0 || initialAssistance);
  
  const effectiveTaskDescription = taskDescription || (initialAssistance ? "General Inquiry" : "New Conversation");

  const placeholderText = 
    (effectiveTaskDescription === "General Inquiry" || effectiveTaskDescription === "New Conversation") && chatMessages.length <=1
    ? "Enter your general inquiry here..."
    : "Ask a follow-up question...";

  const showBrainstormButton = isOpen && !isLoadingInitial && !isSendingFollowUp && 
                              (taskDescription && taskDescription !== "How can I help you today?" && taskDescription !== "General Inquiry");


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b bg-background z-10 sticky top-0">
          <DialogTitle className="text-xl flex items-center">
            <Brain className="h-6 w-6 mr-2 text-primary" />
            AI Student Assistant
          </DialogTitle>
          {effectiveTaskDescription && effectiveTaskDescription !== "New Conversation" && (
            <div className="text-muted-foreground mt-1.5 text-sm flex items-center justify-between p-2.5 bg-muted/30 rounded-md border border-dashed border-muted-foreground/30">
              <div className="truncate pr-2">
                <span className="font-medium text-foreground/80">Context:</span> 
                <span className="italic ml-1.5 text-foreground/90">"{effectiveTaskDescription}"</span>
              </div>
              {latestIdentifiedType.current && (
                 <Badge variant="outline" className="capitalize text-xs py-0.5 whitespace-nowrap shrink-0">
                  <TaskTypeIcon type={latestIdentifiedType.current} />
                  <span className="ml-1.5">{latestIdentifiedType.current.replace('_', ' ')}</span>
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 relative flex flex-col"> 
          <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}> {/* Added flex-1 min-h-0 here */}
            <div className="p-4 space-y-4">
              {isLoadingInitial && chatMessages.length <=1 && !initialAssistance ? (
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
                        {format(msg.timestamp || Date.now(), "p")}
                      </div>
                    </div>
                    {msg.role === 'user' && <UserCircle className="h-6 w-6 text-muted-foreground flex-shrink-0 self-start mt-1" />}
                  </div>
                ))
              ) : !isLoadingInitial && ( 
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center">
                  <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="font-medium">Start the conversation!</p>
                  <p className="text-xs">{placeholderText}</p>
                </div>
              )}
              {isSendingFollowUp && chatMessages.length > 0 && chatMessages[chatMessages.length -1].role === 'user' && (
                <div className="flex items-end space-x-2 justify-start">
                  <Bot className="h-6 w-6 text-primary flex-shrink-0 self-start mt-1 animate-pulse" />
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
        
        {showBrainstormButton && (
          <div className="p-2 px-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={handleBrainstormRequest}
              disabled={isEssentiallyLoading}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Brainstorm ideas for "{effectiveTaskDescription}"
            </Button>
          </div>
        )}

        <div className="p-4 border-t bg-background"> 
          <div className="flex items-start space-x-2">
            <Textarea
              placeholder={placeholderText}
              value={currentUserInput}
              onChange={(e) => setCurrentUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSendMessage) handleSendFollowUp();
                }
              }}
              rows={1}
              className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm"
              disabled={isEssentiallyLoading || (!taskDescription && !initialAssistance && chatMessages.length === 0) } 
            />
            <Button
              onClick={()=>handleSendFollowUp()}
              disabled={!canSendMessage}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              aria-label="Send follow-up question"
            >
              {isSendingFollowUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 pt-3 border-t sm:justify-between bg-background text-xs text-muted-foreground">
          AI can make mistakes. Consider checking important information.
          <Button onClick={handleCloseModal} variant="outline" size="sm">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
