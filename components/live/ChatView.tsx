"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChatMessage, Message, ToolDisplay } from "@/components/ChatMessage";
import { BreathworkTimer } from "@/components/BreathworkTimer";
import { MealScanner } from "@/components/MealScanner";
import { QuickLogModal } from "@/components/v3/QuickLogModal";
import { ProactiveGreeting } from "./ProactiveGreeting";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Camera, Timer } from "lucide-react";
import {
  getWeekStart,
  PILLAR_CONFIGS,
  PILLARS,
  type Pillar,
  type CoreFiveLog,
  getPillarProgress,
  getPrimeCoverage,
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
// Contextual placeholder based on time of day
// ============================================================================

function getContextualPlaceholder(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Log sleep, plan the day...";
  if (hour >= 12 && hour < 17) return "Log a workout, scan a meal...";
  if (hour >= 17 && hour < 22) return "Start breathwork, review the week...";
  return "Ask anything...";
}

// ============================================================================
// Compact Mini Ring Dots (shown at top of chat when conversation is active)
// ============================================================================

function ChatMiniRings() {
  const [pillarData, setPillarData] = useState<
    { pillar: Pillar; met: boolean; color: string }[]
  >([]);

  useEffect(() => {
    const readFromCache = () => {
      try {
        const weekStart = getWeekStart(new Date());
        const cached = localStorage.getItem(`huuman_logs_${weekStart}`);
        if (cached) {
          const logs: CoreFiveLog[] = JSON.parse(cached);
          setPillarData(
            PILLARS.map((p) => ({
              pillar: p,
              met: getPillarProgress(logs, p) >= PILLAR_CONFIGS[p].weeklyTarget,
              color: PILLAR_CONFIGS[p].color,
            }))
          );
        } else {
          setPillarData(
            PILLARS.map((p) => ({
              pillar: p,
              met: false,
              color: PILLAR_CONFIGS[p].color,
            }))
          );
        }
      } catch {
        /* ignore */
      }
    };

    readFromCache();
    window.addEventListener("huuman:logCreated", readFromCache);
    return () => window.removeEventListener("huuman:logCreated", readFromCache);
  }, []);

  if (pillarData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.snappy}
      className="flex items-center justify-center gap-2 py-2"
    >
      {pillarData.map(({ pillar, met, color }) => (
        <div
          key={pillar}
          className="w-[10px] h-[10px] rounded-full transition-colors duration-500"
          style={{
            backgroundColor: met ? color : "transparent",
            border: `1.5px solid ${met ? color : `${color}40`}`,
          }}
        />
      ))}
    </motion.div>
  );
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
  const [logPillar, setLogPillar] = useState<Pillar | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isEmpty = messages.length === 0;
  const placeholder = useMemo(() => getContextualPlaceholder(), []);
  const hasText = input.trim().length > 0;
  // Show quick-action icons when input is empty & not focused, or empty & focused but no text
  const showQuickActions = !hasText && !isLoading;

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

  // Ring tap → direct log actions
  const handleDirectLog = useCallback((pillar: Pillar) => {
    setLogPillar(pillar);
  }, []);

  const handleDirectTimer = useCallback(() => {
    setShowBreathworkTimer(true);
  }, []);

  const handleDirectScanner = useCallback(() => {
    setShowMealScanner(true);
  }, []);

  const handleLogSaved = useCallback((_log: CoreFiveLog) => {
    setLogPillar(null);
    // Dispatch log event for cache invalidation + toast
    window.dispatchEvent(new CustomEvent("huuman:logCreated"));
  }, []);

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

  const weekStart = useMemo(() => getWeekStart(new Date()), []);

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Messages / Empty State */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-x-hidden [webkit-overflow-scrolling:touch] ${
            isEmpty
              ? "overflow-hidden"
              : "overflow-y-auto overscroll-contain scrollbar-hide"
          }`}
          onScroll={(e) => onScroll?.(e.currentTarget.scrollTop)}
        >
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <ProactiveGreeting
                key="greeting"
                onSend={handleSend}
                onLog={handleDirectLog}
                onTimer={handleDirectTimer}
                onScanner={handleDirectScanner}
              />
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-5 py-4"
              >
                {/* Compact mini rings at top of chat */}
                <ChatMiniRings />

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

        {/* Input Area — no safe-area padding, tab bar below handles it */}
        <div className="flex-shrink-0 px-4 pt-2 pb-2 bg-gradient-to-t from-black/50 to-transparent">
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

          {/* Enhanced text input with quick-action buttons */}
          <div className="flex items-end gap-2">
            {/* Quick-action buttons — visible when no text is typed */}
            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={springs.snappy}
                  className="flex gap-1.5 flex-shrink-0 overflow-hidden"
                >
                  {/* Meal scan */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    transition={springs.tap}
                    onClick={() => {
                      Haptics.light();
                      setShowMealScanner(true);
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    <Camera className="w-[18px] h-[18px]" style={{ color: "#22c55e" }} />
                  </motion.button>

                  {/* Breathwork timer */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    transition={springs.tap}
                    onClick={() => {
                      Haptics.light();
                      setShowBreathworkTimer(true);
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: "rgba(6,182,212,0.12)",
                      border: "1px solid rgba(6,182,212,0.2)",
                    }}
                  >
                    <Timer className="w-[18px] h-[18px]" style={{ color: "#06b6d4" }} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text input */}
            <div
              className="relative flex-1 rounded-2xl border border-white/15 transition-[border-color,box-shadow,background-color] duration-300 focus-within:border-white/30 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 text-[15px] text-white placeholder:text-white/20 resize-none focus:outline-none max-h-[120px] min-h-[44px] bg-transparent"
              />

              <AnimatePresence>
                {hasText && (
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
                    className="absolute right-2 bottom-1.5 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 transition-transform"
                  >
                    <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* QuickLogModal (from ring tap) */}
      {logPillar && (
        <QuickLogModal
          pillar={logPillar}
          config={PILLAR_CONFIGS[logPillar]}
          weekStart={weekStart}
          onClose={() => setLogPillar(null)}
          onSave={handleLogSaved}
        />
      )}

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
