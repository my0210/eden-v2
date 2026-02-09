"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, Message, ToolDisplay } from "@/components/ChatMessage";
import { BreathworkTimer } from "@/components/BreathworkTimer";
import { MealScanner } from "@/components/MealScanner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, LayoutDashboard, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { getWeekStart, PILLAR_CONFIGS, PILLARS, type CoreFiveLog, getPillarProgress } from "@/lib/v3/coreFive";

// ============================================================================
// Smart Prompts
// ============================================================================

const DEFAULT_PROMPTS = [
  "How's my week looking?",
  "Log 30 min of cardio",
  "Give me a quick workout",
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
    else if (pillar === 'strength' && current < config.weeklyTarget) prompts.push("Give me a workout");
    else if (pillar === 'clean_eating' && current < config.weeklyTarget) prompts.push("Scan my meal");
    else if (pillar === 'mindfulness' && current === 0) prompts.push("Start breathwork");
  }
  const metCount = PILLARS.filter(p => getPillarProgress(logs, p) >= PILLAR_CONFIGS[p].weeklyTarget).length;
  if (metCount >= 4) prompts.unshift("What's left to hit all 5?");
  else if (metCount === 0 && logs.length === 0) return DEFAULT_PROMPTS;
  else prompts.unshift("How's my week looking?");
  return prompts.slice(0, 4);
}

// ============================================================================
// Chat Page (Main Screen)
// ============================================================================

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(DEFAULT_PROMPTS);
  const [showBreathworkTimer, setShowBreathworkTimer] = useState(false);
  const [showMealScanner, setShowMealScanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Fetch smart prompts on mount
  useEffect(() => {
    const weekStart = getWeekStart(new Date());
    fetch(`/api/v3/log?week_start=${weekStart}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) setSuggestedPrompts(getSmartPrompts(data.logs));
      })
      .catch(() => {});
  }, []);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Listen for external chat trigger events
  useEffect(() => {
    const handleAskAboutItem = (e: CustomEvent<{ question: string }>) => {
      handleSend(e.detail.question);
    };
    window.addEventListener("huuman:askAboutItem", handleAskAboutItem as EventListener);
    return () => window.removeEventListener("huuman:askAboutItem", handleAskAboutItem as EventListener);
  }, []);

  const handleTimerStart = useCallback((minutes: number) => {
    setShowBreathworkTimer(true);
  }, []);

  const handleScannerOpen = useCallback(() => {
    setShowMealScanner(true);
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setSuggestedPrompts([]);

    // Add placeholder assistant message for streaming feel
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    }]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();

      // Update assistant message with real content
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? {
              ...m,
              content: data.message,
              toolResults: data.toolResults || [],
              isStreaming: false,
            }
          : m
      ));

      // Dispatch log event and invalidate dashboard cache
      if (data.hasLogs) {
        // Clear the cached logs so dashboard fetches fresh data
        try {
          const weekStart = getWeekStart(new Date());
          localStorage.removeItem(`huuman_logs_${weekStart}`);
        } catch {}
        window.dispatchEvent(new CustomEvent('huuman:logCreated'));
      }

      // Refresh smart prompts
      const weekStart = getWeekStart(new Date());
      fetch(`/api/v3/log?week_start=${weekStart}`)
        .then(res => res.json())
        .then(d => {
          if (d.logs) setSuggestedPrompts(getSmartPrompts(d.logs));
        })
        .catch(() => {});

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: "Sorry, I had trouble responding. Please try again.", isStreaming: false }
          : m
      ));
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
    <>
      <div className="h-[100dvh] flex flex-col" style={{ backgroundColor: '#0a0a0b' }}>
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3">
          <span className="text-lg font-light tracking-tight text-white/40">huuman</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push("/week")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <LayoutDashboard className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {isEmpty ? (
            /* Empty State -- centered greeting with prompts */
            <div className="flex flex-col justify-end h-full px-5 pb-4">
              <div className="flex flex-col items-center mb-10">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <span className="text-xl">✦</span>
                </div>
                <p className="text-white/30 text-sm text-center max-w-[260px] leading-relaxed">
                  What can I help you with today?
                </p>
              </div>

              {/* Prompt cards */}
              <div className="grid grid-cols-2 gap-2">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="px-4 py-3.5 rounded-2xl text-left text-[13px] text-white/60 hover:text-white/80 transition-all duration-150 active:scale-[0.97] border border-white/6 hover:border-white/12 hover:bg-white/4"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="px-5 py-4">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  onTimerStart={handleTimerStart}
                  onScannerOpen={handleScannerOpen}
                />
              ))}

              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
                <div className="flex gap-1.5 py-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
          {/* Inline suggested prompts (after conversation starts) */}
          {!isEmpty && suggestedPrompts.length > 0 && !isLoading && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2.5 -mx-1 px-1">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] text-white/40 hover:text-white/70 transition-colors whitespace-nowrap active:scale-[0.97] border border-white/6 hover:border-white/12"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input field */}
          <div 
            className="relative rounded-2xl border border-white/8 transition-colors focus-within:border-white/15"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message huuman..."
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-3.5 pr-12 text-[15px] text-white placeholder:text-white/20 resize-none focus:outline-none max-h-[120px] min-h-[48px] bg-transparent"
            />
            
            <AnimatePresence>
              {input.trim() && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => handleSend()}
                  disabled={isLoading}
                  className="absolute right-2 bottom-2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all"
                >
                  <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Breathwork Timer Overlay */}
      <AnimatePresence>
        {showBreathworkTimer && (
          <BreathworkTimer
            onComplete={() => {
              window.dispatchEvent(new CustomEvent('huuman:logCreated'));
            }}
            onClose={() => setShowBreathworkTimer(false)}
          />
        )}
      </AnimatePresence>

      {/* Meal Scanner Overlay */}
      <AnimatePresence>
        {showMealScanner && (
          <MealScanner
            onComplete={() => {
              window.dispatchEvent(new CustomEvent('huuman:logCreated'));
            }}
            onClose={() => setShowMealScanner(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
