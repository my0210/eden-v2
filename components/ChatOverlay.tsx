"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Drawer } from "vaul";
import { ChatMessage, Message } from "./ChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import { getWeekStart, PILLAR_CONFIGS, PILLARS, type CoreFiveLog, getPillarProgress } from "@/lib/v3/coreFive";

// Default prompts shown before we have progress data
const DEFAULT_PROMPTS = [
  "How's my week looking?",
  "Log 30 min of cardio",
  "What should I focus on today?",
];

/**
 * Generate smart suggested prompts based on Core Five progress.
 */
function getSmartPrompts(logs: CoreFiveLog[]): string[] {
  const prompts: string[] = [];

  for (const pillar of PILLARS) {
    const config = PILLAR_CONFIGS[pillar];
    const current = getPillarProgress(logs, pillar);
    const remaining = config.weeklyTarget - current;

    if (remaining <= 0) continue;

    if (pillar === 'cardio' && current === 0) {
      prompts.push("Log a walk or run");
    } else if (pillar === 'sleep' && current === 0) {
      prompts.push("Log last night's sleep");
    } else if (pillar === 'strength' && current < config.weeklyTarget) {
      prompts.push("Log a strength session");
    } else if (pillar === 'clean_eating' && current < config.weeklyTarget) {
      prompts.push("Log a clean eating day");
    } else if (pillar === 'mindfulness' && current === 0) {
      prompts.push("Start a 10 min breathwork");
    }
  }

  const metCount = PILLARS.filter(p => getPillarProgress(logs, p) >= PILLAR_CONFIGS[p].weeklyTarget).length;

  if (metCount >= 4) {
    prompts.unshift("What's left to hit all 5?");
  } else if (metCount === 0 && logs.length === 0) {
    return DEFAULT_PROMPTS;
  } else {
    prompts.unshift("How's my week looking?");
  }

  return prompts.slice(0, 3);
}

interface ChatOverlayProps {
  trigger: React.ReactNode;
  customTrigger?: (open: () => void) => React.ReactNode;
}

export function ChatOverlay({ trigger, customTrigger }: ChatOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(DEFAULT_PROMPTS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasFetchedSmartPrompts = useRef(false);
  const logsCreatedInSession = useRef(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Fetch smart prompts when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0 && !hasFetchedSmartPrompts.current) {
      hasFetchedSmartPrompts.current = true;
      const weekStart = getWeekStart(new Date());
      fetch(`/api/v3/log?week_start=${weekStart}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.logs) {
            setSuggestedPrompts(getSmartPrompts(data.logs));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, messages.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Listen for external chat trigger events
  useEffect(() => {
    const handleAskAboutItem = (e: CustomEvent<{ question: string }>) => {
      setIsOpen(true);
      setTimeout(() => {
        handleSend(e.detail.question);
      }, 400);
    };

    window.addEventListener("huuman:askAboutItem", handleAskAboutItem as EventListener);
    return () => {
      window.removeEventListener("huuman:askAboutItem", handleAskAboutItem as EventListener);
    };
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setSuggestedPrompts([]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      const primaryAction = data.action || null;
      const allActions = data.actions || (primaryAction ? [primaryAction] : []);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        action: primaryAction,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (allActions.length > 1) {
        for (let i = 1; i < allActions.length; i++) {
          const actionMsg: Message = {
            id: (Date.now() + 2 + i).toString(),
            role: "assistant",
            content: "",
            action: allActions[i],
          };
          setMessages((prev) => [...prev, actionMsg]);
        }
      }

      const hasLogAction = allActions.some((a: { type: string }) => a.type === 'log');
      if (hasLogAction) {
        logsCreatedInSession.current = true;
        window.dispatchEvent(new CustomEvent('huuman:logCreated'));
      }

      if (data.suggestedPrompts) {
        setSuggestedPrompts(data.suggestedPrompts);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I had trouble responding. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open && logsCreatedInSession.current) {
          logsCreatedInSession.current = false;
          window.dispatchEvent(new CustomEvent('huuman:logCreated'));
        }
      }}
    >
      <Drawer.Trigger asChild>
        {customTrigger ? customTrigger(() => setIsOpen(true)) : trigger}
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 z-[100]"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        />
        
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col outline-none rounded-t-2xl"
          style={{
            height: '92dvh',
            backgroundColor: 'rgba(18, 18, 20, 0.98)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
          }}
        >
          {/* Drag Handle + Header */}
          <div className="flex-shrink-0">
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-1 rounded-full bg-white/20" />
            </div>
            
            <div className="flex items-center justify-between px-4 py-2">
              <div className="w-8" />
              <span className="text-sm font-medium text-white/70 tracking-tight">huuman</span>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-0 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <svg className="w-5 h-5 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                </div>
                <p className="text-white/30 text-xs max-w-[200px]">
                  Ask about your week, log an activity, or get a recommendation.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChatMessage message={message} />
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl px-4 py-3 bg-white/5">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 px-4 pt-2 pb-4 safe-area-bottom" style={{ backgroundColor: 'rgba(18, 18, 20, 0.98)' }}>
            {/* Suggested Prompts - horizontal scroll */}
            <AnimatePresence>
              {suggestedPrompts.length > 0 && !isLoading && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <SuggestedPrompts prompts={suggestedPrompts} onSelect={handleSend} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex items-end gap-2">
              <div className="relative flex-1 rounded-2xl border border-white/10 bg-white/5 focus-within:border-white/20 focus-within:bg-white/8 transition-all duration-200">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message huuman..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-4 py-3 pr-12 bg-transparent text-sm text-white placeholder:text-white/25 resize-none focus:outline-none max-h-[120px] min-h-[44px]"
                />
                
                <AnimatePresence>
                  {input.trim() && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => handleSend()}
                      disabled={isLoading}
                      className="absolute right-1.5 bottom-1.5 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all"
                    >
                      <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
