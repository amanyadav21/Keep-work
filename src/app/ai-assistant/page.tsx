
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Send, UserCircle, Bot, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useLocalStorage from '@/hooks/useLocalStorage';

// Define a placeholder type for AIOutputType
type AIOutputType = {
  assistantResponse: string;
};

// Updated OpenRouter API call function
async function getOpenRouterAssistance(
  currentInquiry: string,
  conversationHistory: Omit<ChatMessage, 'timestamp'>[] = []
): Promise<AIOutputType> {
  console.log("AI Assistant: Attempting to call OpenRouter with inquiry:", currentInquiry);
  
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_YOUR_SITE_URL || "http://localhost:3000"; 
  const siteName = process.env.NEXT_PUBLIC_YOUR_SITE_NAME || "Upnext Student Assistant"; 

  // --- Enhanced Diagnostic Logging ---
  console.log("--- AI Assistant Environment Variable Check ---");
  if (typeof apiKey === 'undefined') {
    console.error("CRITICAL: NEXT_PUBLIC_OPENROUTER_API_KEY is UNDEFINED in process.env.");
    console.log("Ensure it's set in your .env.local file and you've RESTARTED your Next.js server.");
    return { assistantResponse: "AI Service Configuration Error: The API Key (NEXT_PUBLIC_OPENROUTER_API_KEY) is completely missing from the application's environment. Please set it in your .env.local file and restart your Next.js server." };
  } else if (apiKey === "") {
    console.warn("WARNING: NEXT_PUBLIC_OPENROUTER_API_KEY is an EMPTY STRING in process.env.");
    console.log("Please ensure your .env.local file has a valid key for NEXT_PUBLIC_OPENROUTER_API_KEY and RESTART your server.");
     return { assistantResponse: "AI Service Configuration Error: The API Key (NEXT_PUBLIC_OPENROUTER_API_KEY) is an empty string. Please provide a valid key in your .env.local file and restart your Next.js server." };
  } else {
    console.log(`NEXT_PUBLIC_OPENROUTER_API_KEY: Found (length: ${apiKey.length}, first 5 chars: ${apiKey.substring(0,5)}...)`);
    if (apiKey.length < 20) { 
        console.warn("The retrieved OpenRouter API key seems unusually short. Please double-check it in your .env.local file:", apiKey);
    }
  }
  console.log(`NEXT_PUBLIC_YOUR_SITE_URL: ${process.env.NEXT_PUBLIC_YOUR_SITE_URL || "Not Set (using default)"}`);
  console.log(`NEXT_PUBLIC_YOUR_SITE_NAME: ${process.env.NEXT_PUBLIC_YOUR_SITE_NAME || "Not Set (using default)"}`);
  console.log("--- End AI Assistant Environment Variable Check ---");
  // --- End Enhanced Diagnostic Logging ---


  const messagesForAPI = [
    { role: "system", content: "You are a helpful student assistant. Provide concise and relevant answers." },
    ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
    { role: "user", content: currentInquiry }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`, 
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl, 
        "X-Title": siteName,     
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: messagesForAPI,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText, error: { message: response.statusText } }));
      console.error("OpenRouter API Error (raw response):", response.status, response.statusText, errorData); 
      const apiErrorMessage = errorData.error?.message || errorData.message || response.statusText;
      throw new Error(`API request failed with status ${response.status}: ${apiErrorMessage}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error("OpenRouter Error: No message content in response", data);
      return { assistantResponse: "Sorry, I couldn't generate a response at this time (empty content from AI)." };
    }
    return { assistantResponse: assistantMessage.trim() };

  } catch (error: any) {
    console.error("Error calling OpenRouter AI (catch block):", error);
    let errorMessage = "Sorry, I couldn't connect to the AI assistant. Please try again later."; 

    // --- More Specific Error Handling ---
    if (error.message) {
      const lowerCaseErrorMessage = error.message.toLowerCase();
      if (lowerCaseErrorMessage.includes("no auth credentials found")) {
         errorMessage = `AI Authentication Error: OpenRouter reported "No auth credentials found". This means the API key was not sent or was malformed in the request to OpenRouter. 
         1. **Verify .env.local**: Ensure NEXT_PUBLIC_OPENROUTER_API_KEY is correctly set.
         2. **Restart Server**: You MUST restart your Next.js development server after changes to .env.local.
         3. **Check Console Logs**: Review the 'AI Assistant Environment Variable Check' logs in your browser console for clues.`;
      } else if (lowerCaseErrorMessage.includes("status 401") || lowerCaseErrorMessage.includes("unauthorized")) {
        errorMessage = `AI authentication failed (401 Unauthorized). This indicates the API key sent to OpenRouter was considered invalid.
        1. **Verify API Key Value**: Double-check the NEXT_PUBLIC_OPENROUTER_API_KEY in .env.local for typos or if it's the correct, active key.
        2. **Check OpenRouter Account**: Ensure your OpenRouter account is active and the key has sufficient credits/permissions.
        3. **Restart Server**: Restart Next.js server after any .env.local changes.`;
      } else if (lowerCaseErrorMessage.includes("api key") || lowerCaseErrorMessage.includes("invalid_api_key")) {
        errorMessage = `AI Service API key may be invalid, missing, or misconfigured. 
        1. **Check .env.local**: Ensure NEXT_PUBLIC_OPENROUTER_API_KEY is present and correct.
        2. **Restart Server**: After .env.local changes, restart your Next.js server.`;
      } else if (lowerCaseErrorMessage.includes("blocked")) {
        errorMessage = "AI request was blocked. This might be due to your OpenRouter account status or API key settings. Please check them.";
      } else if (lowerCaseErrorMessage.includes("insufficient_quota") || lowerCaseErrorMessage.includes("rate_limit_exceeded")) {
        errorMessage = "AI request failed due to rate limits or insufficient quota on your OpenRouter account. Please check your account or try again later.";
      } else {
        errorMessage = `AI Error: ${error.message}`;
      }
    }
    // --- End More Specific Error Handling ---
    return { assistantResponse: errorMessage };
  }
}


const GENERAL_INQUIRY_PLACEHOLDER = "How can I help you today?";
const SERVER_RENDER_PLACEHOLDER = "Enter your general inquiry here...";
const AI_UNAVAILABLE_MESSAGE = "AI Assistant is currently unavailable. Please check your AI service configuration, API key in .env.local, and restart your server.";


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

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, 0);
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
      needsChatReset = true; 
    } else if (chatMessages.length > 0 && chatMessages[0]?.role === 'user' && chatMessages[0]?.content !== intendedContext) {
      needsChatReset = true;
    }


    if (needsChatReset) {
      console.log("AI Assistant: Context change detected or empty chat for intended context. Resetting chat.");
      setCurrentOriginalTaskContext(intendedContext);
      const firstUserMessage: ChatMessage = { role: 'user', content: intendedContext, timestamp: Date.now() };
      setChatMessages([firstUserMessage]);
      setIsLoadingInitial(true); 
    } else if (chatMessages.length === 1 && chatMessages[0]?.role === 'user' && chatMessages[0]?.content === intendedContext) {
      const aiResponseExistsForThisContext = chatMessages.length > 1 && chatMessages[1]?.role === 'assistant';
      if (!aiResponseExistsForThisContext) {
        setIsLoadingInitial(true);
      } else {
        setIsLoadingInitial(false);
      }
    } else {
       setIsLoadingInitial(false);
    }

  }, [mounted, searchParams, currentOriginalTaskContext, setCurrentOriginalTaskContext, chatMessages, setChatMessages]);


  useEffect(() => {
    if (!mounted || !isLoadingInitial || chatMessages.length !== 1 || chatMessages[0].role !== 'user') {
      if (isLoadingInitial && chatMessages.length > 1) setIsLoadingInitial(false); 
      return;
    }
    
    if (chatMessages[0].content !== currentOriginalTaskContext) {
        console.warn("AI Assistant: Mismatch between first message and currentOriginalTaskContext during initial AI call attempt. Context may have changed. Aborting AI call.");
        setIsLoadingInitial(false); 
        return;
    }

    const userFirstMessage = chatMessages[0].content;
    setCurrentUserInput(""); 

    console.log("AI Assistant: Making initial AI call for:", userFirstMessage);
    getOpenRouterAssistance(userFirstMessage)
      .then(result => {
        setChatMessages(prev => {
          if (prev.length === 1 && prev[0].role === 'user' && prev[0].content === userFirstMessage) {
            return [...prev, { role: 'assistant', content: result.assistantResponse, timestamp: Date.now() }];
          }
          console.warn("AI Assistant: Initial chat context changed before AI response arrived. Not updating messages.");
          return prev;
        });
      })
      .catch(error => { 
        console.error("Initial AI assistance error (unexpected path, should be caught by getOpenRouterAssistance):", error);
        toast({
          title: "AI Assistance Failed",
          description: error.message || AI_UNAVAILABLE_MESSAGE,
          variant: "destructive",
        });
        setChatMessages(prev => {
           if (prev.length === 1 && prev[0].role === 'user' && prev[0].content === userFirstMessage) {
            return [...prev, { role: 'assistant', content: `Sorry, I couldn't process that initial request. ${error.message || AI_UNAVAILABLE_MESSAGE}`, timestamp: Date.now() }];
          }
          return prev;
        });
      })
      .finally(() => {
        setIsLoadingInitial(false);
      });
  }, [mounted, chatMessages, currentOriginalTaskContext, toast, setChatMessages, setIsLoadingInitial]); 


  useEffect(() => {
    if (!mounted) return;
    if (chatMessages.length > 0) {
      const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom || chatMessages[chatMessages.length - 1].role === 'user') {
          scrollToBottom("smooth");
        }
      } else {
         scrollToBottom("auto"); 
      }
    }
  }, [mounted, chatMessages, scrollToBottom]);

  const handleSendFollowUp = useCallback(async () => {
    if (!mounted || !currentUserInput.trim()) return;

    const userMessageContent = currentUserInput.trim();
    const newUserMessage: ChatMessage = { role: 'user', content: userMessageContent, timestamp: Date.now() };
    
    const currentChatForAPI = [...chatMessages, newUserMessage];
    setChatMessages(currentChatForAPI);
    setCurrentUserInput("");
    setIsSendingFollowUp(true);

    try {
      const historyForAI = currentChatForAPI 
        .map(msg => ({ role: msg.role, content: msg.content })); 
      
      const result = await getOpenRouterAssistance(newUserMessage.content, historyForAI.slice(0, -1));
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.assistantResponse, timestamp: Date.now() }]);
    } catch (error: any) { 
      console.error("AI follow-up assistance error (unexpected path, should be caught by getOpenRouterAssistance):", error);
      toast({
        title: "AI Follow-up Failed",
        description: error.message || AI_UNAVAILABLE_MESSAGE,
        variant: "destructive",
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error. ${error.message || AI_UNAVAILABLE_MESSAGE}`, timestamp: Date.now() }]);
    } finally {
      setIsSendingFollowUp(false);
    }
  }, [mounted, currentUserInput, toast, setChatMessages, chatMessages]); 

  const isProcessing = isLoadingInitial || isSendingFollowUp;
  
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
      <header className="p-4 border-b bg-card sticky top-0 z-10 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className='flex items-center gap-2'>
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">AI Student Assistant</h1>
        </div>
      </header>

      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
        {mounted && displayContext && (
          <div className="px-4 py-2 border-b bg-muted shadow-sm">
            <div className="text-sm flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2 overflow-hidden">
                <span className="font-medium text-foreground/80">Context:</span>
                <span className="italic ml-1.5 text-foreground/90 truncate">{displayContext}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 relative flex flex-col"> 
          <ScrollArea className="absolute inset-0 min-h-0" ref={scrollAreaRef} tabIndex={0} style={{outline: 'none'}}>
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
                          "prose prose-sm dark:prose-invert max-w-[85%] p-3 rounded-lg border text-sm break-words",
                          msg.role === 'user'
                            ? 'bg-primary/10 border-primary/30 text-primary-foreground dark:text-foreground' 
                            : 'bg-secondary text-secondary-foreground dark:bg-muted dark:text-foreground' 
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
                      <div className="bg-muted p-3 rounded-lg border border-border text-sm text-muted-foreground italic w-fit">
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
              className="absolute bottom-4 right-4 h-9 w-9 rounded-full shadow-md bg-card hover:bg-muted z-20 border-border"
              onClick={() => scrollToBottom('smooth')}
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-start space-x-2">
            <Textarea
              placeholder={placeholderText}
              value={currentUserInput}
              onChange={(e) => setCurrentUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isProcessing && currentUserInput.trim()) handleSendFollowUp();
                }
              }}
              rows={1}
              className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm bg-input text-foreground placeholder:text-muted-foreground"
              disabled={!mounted || isProcessing}
            />
            <Button
              onClick={handleSendFollowUp}
              disabled={!mounted || isProcessing || !currentUserInput.trim()}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              aria-label="Send follow-up question"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
            <p className="text-xs text-center text-muted-foreground pt-2">
                AI responses are powered by DeepSeek R1 (Free) via OpenRouter.
            </p>
        </div>
      </div>

      <div className="p-3 text-center border-t border-border text-xs text-muted-foreground bg-background sticky bottom-0 z-10">
        AI can make mistakes. Consider checking important information.
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <AIAssistantPageContent />
    </Suspense>
  );
}
