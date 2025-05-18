
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types'; // Directly use StudentAssistantOutput where needed
import { getStudentAssistance, type StudentAssistantInput, type StudentAssistantOutput } from '@/ai/flows/student-assistant-flow';
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

const GENERAL_INQUIRY_PLACEHOLDER = "How can I help you today?";

function AIAssistantPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTaskDescription = searchParams.get('taskDescription') || null;

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUserInput, setCurrentUserInput] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  
  // currentTaskContext is effectively the user's first message.
  // currentOriginalTaskContext is the underlying task description if provided, otherwise the first message.
  const [currentTaskContext, setCurrentTaskContext] = useState<string | null>(initialTaskDescription);
  const [currentOriginalTaskContext, setCurrentOriginalTaskContext] = useState<string | null>(initialTaskDescription);

  const { toast } = useToast();
  const latestIdentifiedType = useRef<StudentAssistantOutput['identifiedTaskType'] | undefined>(undefined);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 0);
  }, []);
  
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      // Show button if not at bottom and there's enough content to scroll
      const atBottom = scrollHeight - scrollTop - clientHeight < 50; 
      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight + 50);
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [chatMessages]); // Re-evaluate on chatMessages change for scrollHeight updates

  useEffect(() => {
    // Update contexts if initialTaskDescription from URL changes
    if (initialTaskDescription !== currentOriginalTaskContext) {
      setCurrentOriginalTaskContext(initialTaskDescription);
      // If it's a new task, the first message in chat becomes this task
      setCurrentTaskContext(initialTaskDescription); 
    }

    const firstQuery = initialTaskDescription || GENERAL_INQUIRY_PLACEHOLDER;

    // Only set initial user message if chat is empty OR if the context truly changes AND no AI response for it yet
    const hasAIResponseForCurrentContext = chatMessages.length > 1 && chatMessages[0].content === firstQuery && chatMessages[1]?.role === 'assistant';

    if (chatMessages.length === 0 || (firstQuery !== chatMessages[0]?.content && !hasAIResponseForCurrentContext)) {
       setChatMessages([{ role: 'user', content: firstQuery, timestamp: Date.now() }]);
       latestIdentifiedType.current = undefined; // Reset identified type for new context
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTaskDescription]); // Only re-run when initialTaskDescription (from URL) changes


  useEffect(() => {
    // This effect handles fetching the initial AI response when chatMessages is updated
    // (e.g., by the previous useEffect setting the first user message).
    if (chatMessages.length === 1 && chatMessages[0].role === 'user' && !isLoadingInitial) {
      setIsLoadingInitial(true);
      setCurrentUserInput(""); // Clear any pending input
      
      const userFirstMessage = chatMessages[0].content;

      getStudentAssistance({ currentInquiry: userFirstMessage, originalTaskContext: currentOriginalTaskContext ?? userFirstMessage })
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
          // scrollToBottom("smooth"); // Scroll is handled by the other useEffect watching chatMessages
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, currentOriginalTaskContext, toast]); // Dependencies: chatMessages, currentOriginalTaskContext, toast

  useEffect(() => {
    if (chatMessages.length > 0) { 
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
        if (isScrolledToBottom || chatMessages[chatMessages.length - 1].role === 'user') { // Always scroll if user just sent
          scrollToBottom("smooth");
        }
      } else { // Fallback if viewport not found yet (e.g., initial render)
        scrollToBottom("smooth");
      }
    }
  }, [chatMessages, scrollToBottom]);

  const handleSendFollowUp = useCallback(async (inquiry?: string) => {
    const currentFollowUpQuery = inquiry || currentUserInput;
    if (!currentFollowUpQuery.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: currentFollowUpQuery, timestamp: Date.now() };
    
    setChatMessages(prev => [...prev, userMessage]);
    if (!inquiry) { 
        setCurrentUserInput(""); 
    }
    setIsSendingFollowUp(true);

    try {
      // Prepare history for AI: exclude the very first user message if it's the same as originalTaskContext
      const historyForAI = chatMessages.filter(msg => 
        !(msg.role === 'user' && msg.content === (currentOriginalTaskContext || GENERAL_INQUIRY_PLACEHOLDER) && chatMessages.indexOf(msg) === 0)
      );
      
      const flowInput: StudentAssistantInput = {
        currentInquiry: currentFollowUpQuery,
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
  }, [currentUserInput, chatMessages, currentOriginalTaskContext, toast, setChatMessages, setCurrentUserInput, setIsSendingFollowUp]);

  const handleBrainstormRequest = useCallback(() => {
    const contextForBrainstorm = currentOriginalTaskContext && currentOriginalTaskContext !== GENERAL_INQUIRY_PLACEHOLDER
                                 ? currentOriginalTaskContext 
                                 : (chatMessages.length > 0 ? [...chatMessages].reverse().find(msg => msg.role === 'user')?.content || "the current topic" : "the current topic");
    handleSendFollowUp(`Help me brainstorm ideas for: "${contextForBrainstorm}"`);
  },[currentOriginalTaskContext, chatMessages, handleSendFollowUp]);

  const isProcessing = isLoadingInitial || isSendingFollowUp;
  const canSendMessage = currentUserInput.trim() && !isProcessing;
  
  const placeholderText = 
    (!currentOriginalTaskContext || currentOriginalTaskContext === GENERAL_INQUIRY_PLACEHOLDER) && chatMessages.length <=1
    ? "Enter your general inquiry here..."
    : "Ask a follow-up question or type your inquiry...";

  const showBrainstormButton = !isProcessing && 
                              (currentOriginalTaskContext && currentOriginalTaskContext !== GENERAL_INQUIRY_PLACEHOLDER);

  const displayContext = currentOriginalTaskContext && currentOriginalTaskContext !== GENERAL_INQUIRY_PLACEHOLDER 
                       ? currentOriginalTaskContext 
                       : null;


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
      {displayContext && (
        <div className="p-3 border-b bg-muted/30 sticky top-[calc(var(--header-height,69px))] z-10">
          <div className="text-sm flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="font-medium text-foreground/80">Context:</span> 
              <span className="italic ml-1.5 text-foreground/90">"{displayContext}"</span>
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

      {/* Chat Area & Scroll Button */}
      <div className="flex-1 min-h-0 relative flex flex-col"> 
        <ScrollArea className="absolute inset-0" ref={scrollAreaRef}>
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
                    {msg.timestamp ? format(msg.timestamp, "p") : ''}
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
            <div ref={messagesEndRef} style={{ height: '1px' }} /> {/* Scroll target */}
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
        <div className="p-2 px-4 border-t bg-background sticky bottom-[calc(var(--input-area-height,88px)+var(--footer-height,45px))] z-10">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={handleBrainstormRequest}
            disabled={isProcessing}
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Brainstorm ideas for "{currentOriginalTaskContext}"
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-background sticky bottom-[var(--footer-height,45px)] z-10"> 
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
            disabled={isProcessing}
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
      <div className="p-3 text-center border-t text-xs text-muted-foreground bg-background sticky bottom-0 z-10">
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

