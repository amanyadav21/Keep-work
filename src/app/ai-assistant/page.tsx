
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types';
import { getStudentAssistance, type StudentAssistantInput, type StudentAssistantOutput } from '@/ai/flows/student-assistant-flow';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Type, Code, ListChecks, HelpCircle, AlertCircle, Send, UserCircle, Bot, ChevronDown, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useLocalStorage from '@/hooks/useLocalStorage';

const TaskTypeIcon: React.FC<{ type: StudentAssistantOutput['identifiedTaskType'] | undefined }> = ({ type }) => {
  if (!type) return <HelpCircle className="h-4 w-4" />;
  switch (type) {
    case 'writing': return <Type className="h-4 w-4" />;
    case 'coding': return <Code className="h-4 w-4" />;
    case 'planning_reminder': return <ListChecks className="h-4 w-4" />;
    case 'general_query': return <HelpCircle className="h-4 w-4" />;
    case 'brainstorming_elaboration': return <Lightbulb className="h-4 w-4" />;
    case 'unknown': return <AlertCircle className="h-4 w-4" />;
    default: return <HelpCircle className="h-4 w-4" />;
  }
};

const GENERAL_INQUIRY_PLACEHOLDER = "How can I help you today?";

function AIAssistantPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('aiAssistantChatMessages', []);
  const [currentOriginalTaskContext, setCurrentOriginalTaskContext] = useLocalStorage<string | null>('aiAssistantContext', null);
  
  const [currentUserInput, setCurrentUserInput] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  
  const { toast } = useToast();
  const latestIdentifiedType = useRef<StudentAssistantOutput['identifiedTaskType'] | undefined>(undefined);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 0);
  }, []);
  
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      if (!viewport) return;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50; 
      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight + 50);
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [chatMessages]); // Re-attach if chatMessages cause scrollHeight change

  // Effect to initialize or update chat based on URL's taskDescription
  useEffect(() => {
    const initialTaskDescriptionFromUrl = searchParams.get('taskDescription');

    if (initialTaskDescriptionFromUrl) {
      // Navigated with a specific task in the URL
      if (initialTaskDescriptionFromUrl !== currentOriginalTaskContext) {
        // This is a new task context or switching from a different context
        setCurrentOriginalTaskContext(initialTaskDescriptionFromUrl);
        setChatMessages([{ role: 'user', content: initialTaskDescriptionFromUrl, timestamp: Date.now() }]);
        latestIdentifiedType.current = undefined;
      } else {
        // It's the same task context, messages from localStorage are loaded.
        // If chatMessages is empty for some reason, re-initialize.
        if (chatMessages.length === 0 || 
            (chatMessages.length > 0 && chatMessages[0].content !== initialTaskDescriptionFromUrl && chatMessages[0].role === 'user')) {
           setChatMessages([{ role: 'user', content: initialTaskDescriptionFromUrl, timestamp: Date.now() }]);
           latestIdentifiedType.current = undefined;
        }
      }
    } else {
      // General inquiry mode (no taskDescription in URL)
      if (currentOriginalTaskContext && currentOriginalTaskContext !== GENERAL_INQUIRY_PLACEHOLDER) {
        // Previously was on a specific task, now in general mode: reset for a fresh general chat.
        setCurrentOriginalTaskContext(GENERAL_INQUIRY_PLACEHOLDER);
        setChatMessages([{ role: 'user', content: GENERAL_INQUIRY_PLACEHOLDER, timestamp: Date.now() }]);
        latestIdentifiedType.current = undefined;
      } else {
        // Continuing a general chat or starting one for the first time.
        // Ensure currentOriginalTaskContext is set to the placeholder if it's null.
        if (!currentOriginalTaskContext) {
            setCurrentOriginalTaskContext(GENERAL_INQUIRY_PLACEHOLDER);
        }
        // If chat is empty or looks like it needs re-initialization for general inquiry
        if (chatMessages.length === 0 || 
            (chatMessages.length > 0 && chatMessages[0].content !== GENERAL_INQUIRY_PLACEHOLDER && chatMessages[0].role === 'user')) {
           setChatMessages([{ role: 'user', content: GENERAL_INQUIRY_PLACEHOLDER, timestamp: Date.now() }]);
           latestIdentifiedType.current = undefined;
        }
        // Otherwise, existing general chat messages (if any) from localStorage are fine.
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // currentOriginalTaskContext, setChatMessages removed to avoid loops with useLocalStorage + searchParams dependency


  // Effect to trigger the initial AI call if chatMessages indicates a new inquiry
  useEffect(() => {
    // Only make an initial AI call if there's exactly one message and it's from the user,
    // and we are not already loading.
    if (chatMessages.length === 1 && chatMessages[0].role === 'user' && !isLoadingInitial) {
      const userFirstMessage = chatMessages[0].content;
      // Prevent AI call if first message is identical to the currentOriginalTaskContext
      // AND there are more than 1 messages already (implying we already fetched initial response)
      // This condition is a bit complex, aiming to avoid re-fetching when navigating back to a task
      // for which history is already loaded.
      const lastAIMessageIndex = chatMessages.slice().reverse().findIndex(m => m.role === 'assistant');
      if (lastAIMessageIndex !== -1 && chatMessages.length > 1) {
        // We have previous AI messages, so initial assistance likely already happened for this context
        return;
      }


      setIsLoadingInitial(true);
      setCurrentUserInput(""); 
      
      // Use the currentOriginalTaskContext from state (which is now backed by localStorage)
      const contextForAICall = currentOriginalTaskContext || GENERAL_INQUIRY_PLACEHOLDER;

      getStudentAssistance({ currentInquiry: userFirstMessage, originalTaskContext: contextForAICall })
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
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, toast, currentOriginalTaskContext]); // isLoadingInitial removed to ensure flow runs when chatMessages is set.


  useEffect(() => {
    if (chatMessages.length > 0) { 
      const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50; // Tolerance
        // Only auto-scroll if user is near the bottom or it's the user's own message
        if (isScrolledToBottom || chatMessages[chatMessages.length - 1].role === 'user') { 
          scrollToBottom("smooth");
        }
      } else { 
        // Fallback for initial render or if viewport not found immediately
        scrollToBottom("auto"); // Use auto for initial potentially large scroll
      }
    }
  }, [chatMessages, scrollToBottom]);

  const handleSendFollowUp = useCallback(async () => {
    if (!currentUserInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: currentUserInput, timestamp: Date.now() };
    
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentUserInput(""); 
    setIsSendingFollowUp(true);

    try {
      // Filter out the very first user message if it's the initial context, to avoid redundancy
      const historyForAI = chatMessages.filter((msg, index) => 
        !(msg.role === 'user' && msg.content === currentOriginalTaskContext && index === 0 && chatMessages.length > 1)
      );
      
      const flowInput: StudentAssistantInput = {
        currentInquiry: userMessage.content, // Use the content of the new user message
        conversationHistory: historyForAI.length > 0 ? historyForAI : [],
        originalTaskContext: currentOriginalTaskContext || GENERAL_INQUIRY_PLACEHOLDER,
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
  }, [currentUserInput, chatMessages, currentOriginalTaskContext, toast, setChatMessages]);

  const isProcessing = isLoadingInitial || isSendingFollowUp;
  const canSendMessage = currentUserInput.trim() && !isProcessing;
  
  const placeholderText = 
    (!currentOriginalTaskContext || currentOriginalTaskContext === GENERAL_INQUIRY_PLACEHOLDER)
    ? "Enter your general inquiry here..."
    : "Ask a follow-up question or type your inquiry...";

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
          <div className="text-sm flex items-center justify-between max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="min-w-0 flex-1 pr-2"> {/* Ensure this div can shrink and truncate its child */}
              <span className="font-medium text-foreground/80">Context:</span> 
              <span className="italic ml-1.5 text-foreground/90 truncate">"{displayContext}"</span>
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

      {/* Main Content Wrapper - Constrained Width */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
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
      </div> {/* End Main Content Wrapper */}

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
