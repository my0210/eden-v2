"use client";

import { useState, useRef, useEffect } from "react";
import { Drawer } from "vaul";
import { ChatMessage, Message } from "./ChatMessage";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import { getWeekStart, PILLAR_CONFIGS, PILLARS, type CoreFiveLog, getPillarProgress } from "@/lib/v3/coreFive";

const DEFAULT_PROMPTS = [
  "How's my week looking?",
  "Log 30 min of cardio",
  "What should I focus on today?",
];

function getSmartPrompts(logs: CoreFiveLog[]): string[] {
  const prompts: string[] = [];

  for (const pillar of PILLARS) {
    const config = PILLAR_CONFIGS[pillar];
    const current = getPillarProgress(logs, pillar);
    if (current >= config.weeklyTarget) continue;

    if (pillar === 'cardio' && current === 0) prompts.push("Log a walk or run");
    else if (pillar === 'sleep' && current === 0) prompts.push("Log last night's sleep");
    else if (pillar === 'strength' && current < config.weeklyTarget) prompts.push("Log a strength session");
    else if (pillar === 'clean_eating' && current < config.weeklyTarget) prompts.push("Log a clean eating day");
    else if (pillar === 'mindfulness' && current === 0) prompts.push("Start a 10 min breathwork");
  }

  const metCount = PILLARS.filter(p => getPillarProgress(logs, p) >= PILLAR_CONFIGS[p].weeklyTarget).length;
  if (metCount >= 4) prompts.unshift("What's left to hit all 5?");
  else if (metCount === 0 && logs.length === 0) return DEFAULT_PROMPTS;
  else prompts.unshift("How's my week looking?");

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !hasFetchedSmartPrompts.current) {
      hasFetchedSmartPrompts.current = true;
      const weekStart = getWeekStart(new Date());
      fetch(`/api/v3/log?week_start=${weekStart}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.logs) setSuggestedPrompts(getSmartPrompts(data.logs));
        })
        .catch(() => {});
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Handle iOS keyboard: scroll input into view when keyboard opens
  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => {
      // Scroll the input into view when keyboard changes viewport
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [isOpen]);

  useEffect(() => {
    const handleAskAboutItem = (e: CustomEvent<{ question: string }>) => {
      setIsOpen(true);
      setTimeout(() => handleSend(e.detail.question), 400);
    };
    window.addEventListener("huuman:askAboutItem", handleAskAboutItem as EventListener);
    return () => window.removeEventListener("huuman:askAboutItem", handleAskAboutItem as EventListener);
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: text }]);
    setInput("");
    setIsLoading(true);
    setSuggestedPrompts([]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      const data = await response.json();

      const primaryAction = data.action || null;
      const allActions = data.actions || (primaryAction ? [primaryAction] : []);

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        action: primaryAction,
      }]);

      if (allActions.length > 1) {
        for (let i = 1; i < allActions.length; i++) {
          setMessages((prev) => [...prev, {
            id: (Date.now() + 2 + i).toString(),
            role: "assistant",
            content: "",
            action: allActions[i],
          }]);
        }
      }

      if (allActions.some((a: { type: string }) => a.type === 'log')) {
        logsCreatedInSession.current = true;
        window.dispatchEvent(new CustomEvent('huuman:logCreated'));
      }

      if (data.suggestedPrompts) setSuggestedPrompts(data.suggestedPrompts);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I had trouble responding. Please try again.",
      }]);
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

  const isEmpty = messages.length === 0;

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
        <Drawer.Overlay className="fixed inset-0 z-[100] bg-black/60" />
        
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col outline-none rounded-t-2xl"
          style={{
            height: '92vh',
            maxHeight: '92vh',
            backgroundColor: '#111113',
          }}
        >
          {/* Handle + Header */}
          <div className="flex-shrink-0">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="w-8" />
              <span className="text-[13px] font-medium text-white/50">huuman</span>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px mx-5" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* Messages or Empty State */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isEmpty ? (
              /* Empty state: prompts are the hero */
              <div className="flex flex-col items-center justify-end h-full px-5 pb-6">
                <div className="flex flex-col items-center mb-8">
                  <div className="text-2xl mb-2">👋</div>
                  <p className="text-white/40 text-sm text-center max-w-[240px]">
                    What can I help you with?
                  </p>
                </div>

                {/* Suggested prompts as cards in empty state */}
                <div className="w-full space-y-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="w-full px-4 py-3.5 rounded-2xl text-left text-[13px] text-white/70 hover:text-white transition-all duration-150 flex items-center justify-between gap-3 active:scale-[0.98]"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <span>{prompt}</span>
                      <ArrowUp className="w-3.5 h-3.5 text-white/20 flex-shrink-0 rotate-45" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <div className="px-4 py-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChatMessage message={message} />
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 px-4 pt-2 pb-4 safe-area-bottom" style={{ backgroundColor: '#111113' }}>
            {/* Inline suggested prompts (after first message) */}
            {!isEmpty && suggestedPrompts.length > 0 && !isLoading && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2.5 -mx-1 px-1 pb-0.5">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] text-white/50 hover:text-white/80 transition-colors whitespace-nowrap active:scale-[0.97]"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message huuman..."
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-11 rounded-2xl text-sm text-white placeholder:text-white/20 resize-none focus:outline-none max-h-[120px] min-h-[44px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
