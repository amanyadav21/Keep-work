
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, StudentAssistantOutput as AIOutputType } from '@/types'; // Renamed for clarity
import { getStudentAssistance, type StudentAssistantInput } from '@/ai/flows/student-assistant-flow';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Type, Code, ListChecks, HelpCircle, AlertCircle, Send, UserCircle, Bot, ChevronDown, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useLocalStorage from '@/hooks/useLocalStorage';

const TaskTypeIcon: React.FC<{ type: AIOutputType['identifiedTaskType'] | undefined }> = ({ type }) => {
  const iconClass = "h-4 w-4 text-primary"; // Apply primary color to icons
  if (!type) return <HelpCircle className={iconClass} />;
  switch (type) {
    case 'writing': return <Type className={iconClass} />;
    case 'coding': return <Code className={iconClass} />;
    case 'planning_reminder': return <ListChecks className={iconClass} />;
    case 'general_query': return <HelpCircle className={iconClass} />;
    case 'brainstorming_elaboration': return <Lightbulb className={iconClass} />;
    case 'unknown': return <AlertCircle className={cn(iconClass, "text-destructive")} />; // Destructive color for unknown
    default: return <HelpCircle className={iconClass} />;
  }
};

const GENERAL_INQUIRY_PLACEHOLDER = "How can I help you today?";
const SERVER_RENDER_PLACEHOLDER = "Enter your general inquiry here...";

function AIAssistantPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('aiAssistantChatMessages', []);
  const [currentOriginalTaskContext, setCurrentOriginalTaskContext] = useLocalStorage<string | null>('aiAssistantContext', null);

  const [currentUserInput, setCurrentUserInput] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  const latestIdentifiedType = useRef<AIOutputType['identifiedTaskType'] | undefined>(undefined);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 0);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      if (!viewport) return;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50; 
      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight + 50); 
    };

    viewport.addEventListener('scroll', handleScroll);
    handleScroll(); 

    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [mounted, chatMessages]);


  useEffect(() => {
    if (!mounted) return;
  
    const initialTaskDescFromUrl = searchParams.get('taskDescription');
    const intendedContext = initialTaskDescFromUrl || GENERAL_INQUIRY_PLACEHOLDER;
  
    let needsChatReset = false;
  
    if (intendedContext !== currentOriginalTaskContext) {
      needsChatReset = true;
    } else if (chatMessages.length === 0 && intendedContext) {
      // If chat is empty but there's an intended context (either URL or general placeholder)
      needsChatReset = true;
    } else if (chatMessages.length > 0 && chatMessages[0]?.role === 'user' && chatMessages[0]?.content !== intendedContext) {
      // If chat has messages but the first user message doesn't match the intended context
      needsChatReset = true;
    }
  
    if (needsChatReset) {
      setCurrentOriginalTaskContext(intendedContext);
      const firstUserMessage: ChatMessage = { role: 'user', content: intendedContext, timestamp: Date.now() };
      setChatMessages([firstUserMessage]);
      latestIdentifiedType.current = undefined;
      
      // Check if an AI response for this specific intendedContext already exists in the *newly set* chatMessages
      // This scenario is unlikely here since we are resetting, but good for consistency.
      const aiResponseAlreadyExistsForIntendedContext = 
        chatMessages.length > 1 && 
        chatMessages[0]?.content === intendedContext && 
        chatMessages[1]?.role === 'assistant';

      if (!aiResponseAlreadyExistsForIntendedContext) {
         setIsLoadingInitial(true);
      } else {
         setIsLoadingInitial(false); 
      }
    } else if (chatMessages.length > 1 && chatMessages[0]?.role === 'user' && chatMessages[0]?.content === intendedContext && chatMessages[1]?.role === 'assistant') {
      // Context is the same, and we already have user + AI messages from localStorage
      const aiMessage = chatMessages[1];
      if(aiMessage.identifiedTaskType){
        latestIdentifiedType.current = aiMessage.identifiedTaskType;
      }
      setIsLoadingInitial(false);
    }

  }, [mounted, searchParams, currentOriginalTaskContext, setCurrentOriginalTaskContext, setChatMessages, setIsLoadingInitial, chatMessages]);


  useEffect(() => {
    if (!mounted || !isLoadingInitial || chatMessages.length !== 1 || chatMessages[0].role !== 'user') {
      if (isLoadingInitial) setIsLoadingInitial(false);
      return;
    }
  
    if (chatMessages[0].content !== currentOriginalTaskContext) {
      console.warn("AI Assistant: Mismatch between first message and currentOriginalTaskContext during initial AI call attempt.");
      setIsLoadingInitial(false);
      return;
    }
  
    const userFirstMessage = chatMessages[0].content;
    setCurrentUserInput("");
  
    getStudentAssistance({ currentInquiry: userFirstMessage, originalTaskContext: currentOriginalTaskContext || GENERAL_INQUIRY_PLACEHOLDER })
      .then(result => {
        latestIdentifiedType.current = result.identifiedTaskType;
        setChatMessages(prev => [...prev, { role: 'assistant', content: result.assistantResponse, timestamp: Date.now(), identifiedTaskType: result.identifiedTaskType }]);
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
  }, [mounted, isLoadingInitial, chatMessages, currentOriginalTaskContext, toast, setChatMessages, latestIdentifiedType]);
  

  useEffect(() => {
    if (!mounted) return;
    if (chatMessages.length > 0) {
      const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        // Auto-scroll if near bottom or if the last message was from the user (meaning AI is about to respond)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; 
        if (isNearBottom || chatMessages[chatMessages.length - 1].role === 'user') {
          scrollToBottom("smooth");
        }
      } else {
        scrollToBottom("auto"); // Fallback if viewport not found immediately
      }
    }
  }, [mounted, chatMessages, scrollToBottom]);

  const handleSendFollowUp = useCallback(async () => {
    if (!mounted || !currentUserInput.trim()) return;

    const userMessageContent = currentUserInput.trim();
    const userMessage: ChatMessage = { role: 'user', content: userMessageContent, timestamp: Date.now() };
    
    let updatedChatHistoryForAICall: ChatMessage[] = [];
    setChatMessages(prev => {
      updatedChatHistoryForAICall = [...prev, userMessage];
      return updatedChatHistoryForAICall;
    });

    setCurrentUserInput("");
    setIsSendingFollowUp(true);

    try {
      // Exclude the very first user message from history if it was the original task context and we have more than 1 message.
      // The originalTaskContext prop handles the very first context.
      const historyForAI = updatedChatHistoryForAICall.filter((msg, index, arr) =>
        !(index === 0 && msg.role === 'user' && msg.content === currentOriginalTaskContext && arr.length > 1)
      );
      
      const flowInput: StudentAssistantInput = {
        currentInquiry: userMessage.content,
        conversationHistory: historyForAI.length > 1 ? historyForAI.slice(0, -1) : [], // History up to before current user message
        originalTaskContext: currentOriginalTaskContext || GENERAL_INQUIRY_PLACEHOLDER,
      };

      const result = await getStudentAssistance(flowInput);
      latestIdentifiedType.current = result.identifiedTaskType;
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.assistantResponse, timestamp: Date.now(), identifiedTaskType: result.identifiedTaskType }]);
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
  }, [mounted, currentUserInput, currentOriginalTaskContext, toast, setChatMessages]);

  const isProcessing = isLoadingInitial || isSendingFollowUp;
  const canSendMessage = mounted && currentUserInput.trim() && !isProcessing;

  const placeholderText =
    !mounted
      ? SERVER_RENDER_PLACEHOLDER 
      : (!currentOriginalTaskContext || currentOriginalTaskContext === GENERAL_INQUIRY_PLACEHOLDER)
        ? "Enter your general inquiry here..."
        : "Ask a follow-up question or type your inquiry...";
  
  const rawDisplayContext = currentOriginalTaskContext && currentOriginalTaskContext !== GENERAL_INQUIRY_PLACEHOLDER
                       ? currentOriginalTaskContext
                       : null;
  
  const displayContext = rawDisplayContext ? rawDisplayContext.replace(/\s+/g, ' ').trim() : null;


  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b bg-background sticky top-0 z-10 flex items-center justify-between">
        <div className='flex items-center gap-2'>
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">AI Student Assistant</h1>
        </div>
      </header>

      {mounted && displayContext && (
        <div className="p-3 border-b bg-muted/30 sticky top-[calc(var(--header-height,69px))] z-10">
          <div className="text-sm flex items-center justify-between max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="min-w-0 flex-1 pr-2 overflow-hidden">
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

      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 relative flex flex-col">
          <ScrollArea className="absolute inset-0" ref={scrollAreaRef} tabIndex={0} style={{outline: 'none'}}>
            <div className="px-4 pt-4 pb-12 space-y-4">
              {!mounted ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p>Loading Assistant...</p>
                </div>
              ) : isLoadingInitial && chatMessages.length <= 1 && chatMessages[0]?.role === 'user' ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p>Thinking...</p>
                  <p className="text-sm">Your AI assistant is generating an initial response.</p>
                </div>
              ) : (
                <>
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
                          "prose prose-sm dark:prose-invert max-w-[85%] p-3 rounded-lg border text-sm text-foreground break-words",
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
                </>
              )}
              <div ref={messagesEndRef} style={{ height: '1px' }} />
            </div>
          </ScrollArea>
          {mounted && showScrollToBottom && (
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
              disabled={!mounted || isProcessing}
            />
            <Button
              onClick={()=>handleSendFollowUp()}
              disabled={!canSendMessage}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              aria-label="Send follow-up question"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

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

