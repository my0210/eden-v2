"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, Message, ToolDisplay } from "@/components/ChatMessage";
import { BreathworkTimer } from "@/components/BreathworkTimer";
import { MealScanner } from "@/components/MealScanner";
import { ProactiveGreeting } from "./ProactiveGreeting";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import {
  getWeekStart,
  PILLAR_CONFIGS,
  PILLARS,
  type CoreFiveLog,
  getPillarProgress,
} from "@/lib/v3/coreFive";
import {
  springs,
  tapScale,
  sendButtonVariants,
  messageEntrance,
} from "./interactions";
import { Haptics } from "@/lib/soul";

// ============================================================================
// Smart Prompts (inline suggestions after conversation starts)
// ============================================================================

function getSmartPrompts(logs: CoreFiveLog[]): string[] {
  const prompts: string[] = [];
  for (const pillar of PILLARS) {
    const config = PILLAR_CONFIGS[pillar];
    const current = getPillarProgress(logs, pillar);
    if (current >= config.weeklyTarget) continue;
    if (pillar === "cardio" && current === 0) prompts.push("Log a walk or run");
    else if (pillar === "sleep" && current === 0)
      prompts.push("Log last night's sleep");
    else if (pillar === "strength" && current < config.weeklyTarget)
      prompts.push("Give me a workout");
    else if (pillar === "clean_eating" && current < config.weeklyTarget)
      prompts.push("Scan my meal");
    else if (pillar === "mindfulness" && current === 0)
      prompts.push("Start breathwork");
  }
  const metCount = PILLARS.filter(
    (p) => getPillarProgress(logs, p) >= PILLAR_CONFIGS[p].weeklyTarget
  ).length;
  if (metCount >= 4) prompts.unshift("What's left to hit all 5?");
  else if (metCount === 0 && logs.length === 0)
    return [
      "How's my week looking?",
      "Log 30 min of cardio",
      "Give me a quick workout",
      "What should I focus on today?",
    ];
  else prompts.unshift("How's my week looking?");
  return prompts.slice(0, 4);
}

// ============================================================================
// ChatView
// ============================================================================

interface ChatViewProps {
  onScroll?: (scrollTop: number) => void;
}

export function ChatView({ onScroll }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [showBreathworkTimer, setShowBreathworkTimer] = useState(false);
  const [showMealScanner, setShowMealScanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
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

  // Focus input on mount (slight delay for tab transition)
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // iOS keyboard: scroll input into view when virtual keyboard resizes viewport
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // When keyboard opens, visualViewport.height shrinks
      requestAnimationFrame(() => {
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    };

    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);

  // Listen for external chat triggers (e.g. from nudge engine)
  useEffect(() => {
    const handleAskAboutItem = (e: CustomEvent<{ question: string }>) => {
      handleSend(e.detail.question);
    };
    window.addEventListener(
      "huuman:askAboutItem",
      handleAskAboutItem as EventListener
    );
    return () =>
      window.removeEventListener(
        "huuman:askAboutItem",
        handleAskAboutItem as EventListener
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimerStart = useCallback(
    (_minutes: number) => setShowBreathworkTimer(true),
    []
  );
  const handleScannerOpen = useCallback(
    () => setShowMealScanner(true),
    []
  );

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setSuggestedPrompts([]);

    // Placeholder for streaming feel
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", isStreaming: true },
    ]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();

      const toolResults: ToolDisplay[] = data.toolResults || [];

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: data.message,
                toolResults,
                isStreaming: false,
              }
            : m
        )
      );

      // Auto-trigger actions (timer, scanner) without user tapping
      for (const result of toolResults) {
        if (result.autoTrigger) {
          if (result.type === 'timer') {
            setShowBreathworkTimer(true);
          } else if (result.type === 'scanner') {
            setShowMealScanner(true);
          }
        }
      }

      // Invalidate dashboard cache and notify
      if (data.hasLogs) {
        try {
          const weekStart = getWeekStart(new Date());
          localStorage.removeItem(`huuman_logs_${weekStart}`);
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new CustomEvent("huuman:logCreated"));
      }

      // Refresh smart prompts
      const weekStart = getWeekStart(new Date());
      fetch(`/api/v3/log?week_start=${weekStart}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.logs) setSuggestedPrompts(getSmartPrompts(d.logs));
        })
        .catch(() => {});
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Sorry, I had trouble responding. Please try again.",
                isStreaming: false,
              }
            : m
        )
      );
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
      <div className="h-full flex flex-col">
        {/* Messages / Empty State */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [webkit-overflow-scrolling:touch]"
          onScroll={(e) => onScroll?.(e.currentTarget.scrollTop)}
        >
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <ProactiveGreeting key="greeting" onSend={handleSend} />
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-5 py-4"
              >
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    {...messageEntrance}
                    transition={springs.snappy}
                  >
                    <ChatMessage
                      message={message}
                      onTimerStart={handleTimerStart}
                      onScannerOpen={handleScannerOpen}
                    />
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isLoading &&
                  messages[messages.length - 1]?.role === "assistant" &&
                  !messages[messages.length - 1]?.content && (
                    <div className="flex gap-1.5 py-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      />
                    </div>
                  )}

                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)] bg-gradient-to-t from-black/50 to-transparent">
          {/* Inline prompts (after conversation starts) */}
          {!isEmpty && suggestedPrompts.length > 0 && !isLoading && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2.5 -mx-1 px-1">
              {suggestedPrompts.map((prompt, i) => (
                <motion.button
                  key={i}
                  whileTap={tapScale}
                  onClick={() => {
                    Haptics.light();
                    handleSend(prompt);
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] text-white/40 hover:text-white/70 transition-colors whitespace-nowrap border border-white/6 hover:border-white/12"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          )}

          {/* Text input */}
          <div
            className="relative rounded-2xl border border-white/15 transition-[border-color,box-shadow,background-color] duration-300 focus-within:border-white/30 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
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
                  variants={sendButtonVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={springs.tap}
                  onClick={() => {
                    Haptics.medium();
                    handleSend();
                  }}
                  disabled={isLoading}
                  className="absolute right-2 bottom-2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 transition-transform"
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
            onComplete={() =>
              window.dispatchEvent(new CustomEvent("huuman:logCreated"))
            }
            onClose={() => setShowBreathworkTimer(false)}
          />
        )}
      </AnimatePresence>

      {/* Meal Scanner Overlay */}
      <AnimatePresence>
        {showMealScanner && (
          <MealScanner
            onComplete={() =>
              window.dispatchEvent(new CustomEvent("huuman:logCreated"))
            }
            onClose={() => setShowMealScanner(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
