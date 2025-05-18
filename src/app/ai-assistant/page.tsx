
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, StudentAssistantOutput } from '@/types';
import { getStudentAssistance, type StudentAssistantInput } from '@/ai/flows/student-assistant-flow';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Brain, Loader2, Type, Code, ListChecks, HelpCircle, AlertCircle, Send, UserCircle, Bot, ChevronDown, MessageSquareText, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

function AIAssistantPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTaskDescription = searchParams.get('taskDescription') || null;

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUserInput, setCurrentUserInput] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [currentTaskContext, setCurrentTaskContext] = useState<string | null>(initialTaskDescription);
  const [currentOriginalTaskContext, setCurrentOriginalTaskContext] = useState<string | null>(initialTaskDescription);


  const { toast } = useToast();
  const latestIdentifiedType = useRef<StudentAssistantOutput['identifiedTaskType'] | undefined>(undefined);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 0);
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
  }, []);

  useEffect(() => {
    if (initialTaskDescription !== currentTaskContext) { // Prevent re-fetch if context is manually changed then page reloaded
      setCurrentTaskContext(initialTaskDescription);
      setCurrentOriginalTaskContext(initialTaskDescription);
    }
    const firstQuery = initialTaskDescription || "How can I help you today?";
    // Only set initial user message if chat is empty or context truly changes
    if (chatMessages.length === 0 || (initialTaskDescription && chatMessages[0]?.content !== firstQuery)) {
       const userMessage: ChatMessage = { role: 'user', content: firstQuery, timestamp: Date.now() };
       setChatMessages([userMessage]);
    } else if (chatMessages.length > 0 && !initialTaskDescription && chatMessages[0]?.content !== firstQuery) {
      // Handle case where user navigates directly to /ai-assistant then back, then to /ai-assistant again
       const userMessage: ChatMessage = { role: 'user', content: firstQuery, timestamp: Date.now() };
       setChatMessages([userMessage]);
    }


    // Only fetch if there's no AI response yet for this context or if it's a general inquiry with no AI response.
    const shouldFetchInitial = chatMessages.length <= 1 || 
                              (chatMessages.length > 0 && chatMessages[chatMessages.length-1].role === 'user');

    if (shouldFetchInitial) {
      setIsLoadingInitial(true);
      setCurrentUserInput("");
      latestIdentifiedType.current = undefined;
      
      getStudentAssistance({ currentInquiry: firstQuery, originalTaskContext: initialTaskDescription ?? firstQuery })
        .then(result => {
          latestIdentifiedType.current = result.identifiedTaskType;
          setChatMessages(prev => [...prev, { role: 'assistant', content: result.assistantResponse, timestamp: Date.now() }]);
        })
        .catch(error => {
          console.error("Initial AI assistance error:", error);
          toast({
            title: "AI Assistance Failed",
            description: "Could not get an initial response.",
            variant: "destructive",
          });
          setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that initial request.", timestamp: Date.now() }]);
        })
        .finally(() => {
          setIsLoadingInitial(false);
          scrollToBottom("smooth");
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTaskDescription, toast]); // Only re-run when initialTaskDescription (from URL) changes

  useEffect(() => {
    if (chatMessages.length > 0 && !isUserScrolledUp) { 
      scrollToBottom("smooth");
    }
  }, [chatMessages, isUserScrolledUp, scrollToBottom]);

  const handleSendFollowUp = useCallback(async (inquiry?: string) => {
    const currentFollowUpQuery = inquiry || currentUserInput;
    if (!currentFollowUpQuery.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: currentFollowUpQuery, timestamp: Date.now() };
    
    setChatMessages(prev => [...prev, userMessage]);
    if (!inquiry) { 
        setCurrentUserInput(""); 
    }
    setIsSendingFollowUp(true);
    setIsUserScrolledUp(false); 

    try {
      // Filter out the initial user message if it was the same as the original task context
      const historyForAI = chatMessages.filter(msg => 
        !(msg.role === 'user' && msg.content === (currentOriginalTaskContext || "How can I help you today?"))
      );

      const flowInput: StudentAssistantInput = {
        currentInquiry: currentFollowUpQuery,
        // Pass the filtered history, or an empty array if historyForAI becomes empty
        conversationHistory: historyForAI.length > 0 ? historyForAI : [], 
        originalTaskContext: currentOriginalTaskContext || (chatMessages[0]?.role === 'user' ? chatMessages[0].content : "General Inquiry"),
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
  }, [currentUserInput, chatMessages, currentOriginalTaskContext, toast, setChatMessages, setCurrentUserInput, setIsSendingFollowUp, setIsUserScrolledUp]);

  const handleBrainstormRequest = useCallback(() => {
    const contextForBrainstorm = currentOriginalTaskContext && currentOriginalTaskContext !== "How can I help you today?"
                                 ? currentOriginalTaskContext 
                                 : (chatMessages.length > 0 ? [...chatMessages].reverse().find(msg => msg.role === 'user')?.content || "the current topic" : "the current topic");
    handleSendFollowUp(`Help me brainstorm ideas for: "${contextForBrainstorm}"`);
  },[currentOriginalTaskContext, chatMessages, handleSendFollowUp]);

  const isEssentiallyLoading = isLoadingInitial || isSendingFollowUp;
  const canSendMessage = currentUserInput.trim() && !isEssentiallyLoading;
  
  const placeholderText = 
    (!currentOriginalTaskContext || currentOriginalTaskContext === "How can I help you today?") && chatMessages.length <=1
    ? "Enter your general inquiry here..."
    : "Ask a follow-up question...";

  const showBrainstormButton = !isEssentiallyLoading && 
                              (currentOriginalTaskContext && currentOriginalTaskContext !== "How can I help you today?");

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="p-4 border-b bg-background sticky top-0 z-10 flex items-center justify-between">
        <div className='flex items-center gap-2'>
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">AI Student Assistant</h1>
        </div>
      </header>

      {/* Context Header */}
      {currentOriginalTaskContext && currentOriginalTaskContext !== "How can I help you today?" && (
        <div className="p-3 border-b bg-muted/30 sticky top-[calc(var(--header-height,69px))] z-10">
          <div className="text-sm flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="font-medium text-foreground/80">Context:</span> 
              <span className="italic ml-1.5 text-foreground/90">"{currentOriginalTaskContext}"</span>
            </div>
            {latestIdentifiedType.current && (
                <Badge variant="outline" className="capitalize text-xs py-0.5 whitespace-nowrap shrink-0">
                <TaskTypeIcon type={latestIdentifiedType.current} />
                <span className="ml-1.5">{latestIdentifiedType.current.replace(/_/g, ' ')}</span>
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 min-h-0 relative flex flex-col"> 
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {isLoadingInitial && chatMessages.length <=1 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                <p>Thinking...</p>
                <p className="text-sm">Your AI assistant is generating an initial response.</p>
              </div>
            )}
            {chatMessages.map((msg, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-end space-x-2 w-full", 
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && <Bot className="h-6 w-6 text-primary flex-shrink-0 self-start mt-1 mb-1" />}
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
                {msg.role === 'user' && <UserCircle className="h-6 w-6 text-muted-foreground flex-shrink-0 self-start mt-1 mb-1" />}
              </div>
            ))}
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
            className="absolute bottom-4 right-4 h-9 w-9 rounded-full shadow-md bg-background hover:bg-muted z-20"
            onClick={() => scrollToBottom('smooth')}
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Brainstorm Button Area */}
      {showBrainstormButton && (
        <div className="p-2 px-4 border-t bg-background">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={handleBrainstormRequest}
            disabled={isEssentiallyLoading}
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Brainstorm ideas for "{currentOriginalTaskContext}"
          </Button>
        </div>
      )}

      {/* Input Area */}
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
            disabled={isEssentiallyLoading}
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

      {/* Footer Note */}
      <div className="p-3 text-center border-t text-xs text-muted-foreground bg-background">
        AI can make mistakes. Consider checking important information.
      </div>
    </div>
  );
}


export default function AIAssistantPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <AIAssistantPageContent />
    </Suspense>
  );
}
