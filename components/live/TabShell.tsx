"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Check, ArrowUp, Camera, Timer } from "lucide-react";
import { ChatMessage, Message, ToolDisplay } from "@/components/ChatMessage";
import { BreathworkTimer } from "@/components/BreathworkTimer";
import { MealScanner } from "@/components/MealScanner";
import { QuickLogModal } from "@/components/v3/QuickLogModal";
import { CoreFiveView } from "@/components/v3/CoreFiveView";
import { SettingsOverlay } from "@/components/SettingsOverlay";
import { HomeContent } from "./HomeContent";
import { Haptics } from "@/lib/soul";
import {
  getWeekStart,
  getPrimeCoverage,
  PILLAR_CONFIGS,
  PILLARS,
  type Pillar,
  type CoreFiveLog,
  getPillarProgress,
} from "@/lib/v3/coreFive";
import {
  springs,
  tapScale,
  sendButtonVariants,
  messageEntrance,
} from "./interactions";
import { UnitSystem, GlucoseUnit, LipidsUnit } from "@/lib/types";

// ============================================================================
// Time-of-day orb
// ============================================================================

function getTimeOfDayColor(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "rgba(251,191,36,0.3)";
  if (hour >= 12 && hour < 17) return "rgba(34,197,94,0.4)";
  if (hour >= 17 && hour < 22) return "rgba(139,92,246,0.3)";
  return "rgba(99,102,241,0.2)";
}

function getTimeOfDaySecondary(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "rgba(245,158,11,0.15)";
  if (hour >= 12 && hour < 17) return "rgba(16,185,129,0.2)";
  if (hour >= 17 && hour < 22) return "rgba(109,40,217,0.15)";
  return "rgba(79,70,229,0.1)";
}

function getAmbientStyle(coverage: number) {
  const map: Record<number, { opacity: number; scale: number }> = {
    0: { opacity: 0.03, scale: 0.8 },
    1: { opacity: 0.05, scale: 0.85 },
    2: { opacity: 0.07, scale: 0.9 },
    3: { opacity: 0.09, scale: 0.95 },
    4: { opacity: 0.12, scale: 1.0 },
    5: { opacity: 0.17, scale: 1.05 },
  };
  return map[coverage] || map[0];
}

// ============================================================================
// Smart prompts for inline chat suggestions
// ============================================================================

function getSmartPrompts(logs: CoreFiveLog[]): string[] {
  const prompts: string[] = [];
  for (const pillar of PILLARS) {
    const config = PILLAR_CONFIGS[pillar];
    const current = getPillarProgress(logs, pillar);
    if (current >= config.weeklyTarget) continue;
    if (pillar === "cardio" && current === 0) prompts.push("Log a walk or run");
    else if (pillar === "sleep" && current === 0) prompts.push("Log last night's sleep");
    else if (pillar === "strength" && current < config.weeklyTarget) prompts.push("Give me a workout");
    else if (pillar === "clean_eating" && current < config.weeklyTarget) prompts.push("Scan my meal");
    else if (pillar === "mindfulness" && current === 0) prompts.push("Start breathwork");
  }
  const metCount = PILLARS.filter(
    (p) => getPillarProgress(logs, p) >= PILLAR_CONFIGS[p].weeklyTarget
  ).length;
  if (metCount >= 4) prompts.unshift("What's left to hit all 5?");
  else if (metCount === 0 && logs.length === 0)
    return ["How's my week looking?", "Log 30 min of cardio", "Give me a quick workout", "What should I focus on today?"];
  else prompts.unshift("How's my week looking?");
  return prompts.slice(0, 4);
}

// ============================================================================
// Contextual placeholder
// ============================================================================

function getContextualPlaceholder(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Log sleep, plan the day...";
  if (hour >= 12 && hour < 17) return "Log a workout, scan a meal...";
  if (hour >= 17 && hour < 22) return "Start breathwork, review the week...";
  return "Ask anything...";
}

// ============================================================================
// Mini rings for chat header
// ============================================================================

function MiniRings({ onClick }: { onClick: () => void }) {
  const [pillarData, setPillarData] = useState<
    { pillar: Pillar; met: boolean; color: string }[]
  >([]);

  useEffect(() => {
    const read = () => {
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
    read();
    window.addEventListener("huuman:logCreated", read);
    return () => window.removeEventListener("huuman:logCreated", read);
  }, []);

  if (pillarData.length === 0) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={springs.snappy}
      onClick={() => {
        Haptics.light();
        onClick();
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors hover:bg-white/5 active:scale-95"
    >
      {pillarData.map(({ pillar, met, color }) => (
        <div
          key={pillar}
          className="w-[7px] h-[7px] rounded-full transition-colors duration-500"
          style={{
            backgroundColor: met ? color : "transparent",
            border: `1.5px solid ${met ? color : `${color}40`}`,
          }}
        />
      ))}
    </motion.button>
  );
}

// ============================================================================
// Toast
// ============================================================================

interface Toast {
  id: number;
  message: string;
  color: string;
}

// ============================================================================
// TabShell — Morph Architecture
// ============================================================================

interface TabShellProps {
  userId: string;
  isAdmin?: boolean;
  coachingStyle?: {
    tone: "supportive" | "neutral" | "tough";
    density: "minimal" | "balanced" | "detailed";
    formality: "casual" | "professional" | "clinical";
  };
  unitSystem?: UnitSystem;
  glucoseUnit?: GlucoseUnit;
  lipidsUnit?: LipidsUnit;
}

export function TabShell({
  userId,
  isAdmin,
  coachingStyle,
  unitSystem,
  glucoseUnit,
  lipidsUnit,
}: TabShellProps) {
  // ── Mode ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<"home" | "chat">("home");
  const isHome = mode === "home";

  // ── Chat state ────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showBreathworkTimer, setShowBreathworkTimer] = useState(false);
  const [showMealScanner, setShowMealScanner] = useState(false);
  const [logPillar, setLogPillar] = useState<Pillar | null>(null);
  const [primeCoverage, setPrimeCoverage] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────
  const hasText = input.trim().length > 0;
  const showQuickActions = !hasText && !isLoading && !isHome;
  const placeholder = useMemo(() => getContextualPlaceholder(), []);
  const weekStart = useMemo(() => getWeekStart(new Date()), []);

  // ── Coverage for ambient orb ──────────────────────────────────────────
  useEffect(() => {
    const read = () => {
      try {
        const ws = getWeekStart(new Date());
        const cached = localStorage.getItem(`huuman_logs_${ws}`);
        if (cached) {
          const logs: CoreFiveLog[] = JSON.parse(cached);
          setPrimeCoverage(getPrimeCoverage(logs));
        }
      } catch {
        /* ignore */
      }
    };
    read();
    const onLog = () => read();
    const onVis = () => {
      if (document.visibilityState === "visible") read();
    };
    window.addEventListener("huuman:logCreated", onLog);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("huuman:logCreated", onLog);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // ── Toast listener ────────────────────────────────────────────────────
  useEffect(() => {
    const handleToast = (e: CustomEvent<{ message: string; color: string }>) => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToast({ id: Date.now(), message: e.detail.message, color: e.detail.color });
      toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
    };
    window.addEventListener("huuman:logToast", handleToast as EventListener);
    return () => {
      window.removeEventListener("huuman:logToast", handleToast as EventListener);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // ── External chat triggers ────────────────────────────────────────────
  useEffect(() => {
    const handleAsk = (e: CustomEvent<{ question: string }>) => {
      morphToChat();
      setTimeout(() => handleSend(e.detail.question), 100);
    };
    window.addEventListener("huuman:askAboutItem", handleAsk as EventListener);
    return () =>
      window.removeEventListener("huuman:askAboutItem", handleAsk as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-resize textarea ──────────────────────────────────────────────
  useEffect(() => {
    const ta = inputRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [input]);

  // ── Ambient orb ───────────────────────────────────────────────────────
  const ambientStyle = getAmbientStyle(primeCoverage);
  const orbPrimary = getTimeOfDayColor();
  const orbSecondary = getTimeOfDaySecondary();

  const handleContentScroll = useCallback(
    (scrollTop: number) => {
      if (!orbRef.current) return;
      const fade = Math.max(0.3, 1 - scrollTop / 400);
      orbRef.current.style.opacity = String(ambientStyle.opacity * fade);
    },
    [ambientStyle.opacity]
  );

  // ── Mode transitions ──────────────────────────────────────────────────

  const morphToChat = useCallback(() => {
    setMode("chat");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    });
  }, []);

  const morphToHome = useCallback(() => {
    setMode("home");
    // Blur input when going home
    inputRef.current?.blur();
  }, []);

  // ── Handle input focus (morph trigger) ────────────────────────────────

  const handleInputFocus = useCallback(() => {
    if (isHome) {
      setMode("chat");
    }
  }, [isHome]);

  // ── Handle send ───────────────────────────────────────────────────────

  const handleSend = useCallback(
    async (messageText?: string) => {
      const text = messageText || input.trim();
      if (!text || isLoading) return;

      // Morph to chat if in home mode
      if (isHome) setMode("chat");

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setSuggestedPrompts([]);

      // Streaming placeholder
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
              ? { ...m, content: data.message, toolResults, isStreaming: false }
              : m
          )
        );

        // Auto-trigger actions
        for (const result of toolResults) {
          if (result.autoTrigger) {
            if (result.type === "timer") setShowBreathworkTimer(true);
            else if (result.type === "scanner") setShowMealScanner(true);
          }
        }

        // Invalidate cache
        if (data.hasLogs) {
          try {
            const ws = getWeekStart(new Date());
            localStorage.removeItem(`huuman_logs_${ws}`);
          } catch {
            /* ignore */
          }
          window.dispatchEvent(new CustomEvent("huuman:logCreated"));
        }

        // Refresh smart prompts
        const ws = getWeekStart(new Date());
        fetch(`/api/v3/log?week_start=${ws}`)
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
                  content: "Sorry, I had trouble responding. Please try again.",
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, isHome]
  );

  // ── Keyboard handling ─────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── Timer / Scanner callbacks ─────────────────────────────────────────

  const handleTimerStart = useCallback(() => setShowBreathworkTimer(true), []);
  const handleScannerOpen = useCallback(() => setShowMealScanner(true), []);

  const handleDirectLog = useCallback((pillar: Pillar) => {
    setLogPillar(pillar);
  }, []);

  const handleLogSaved = useCallback(() => {
    setLogPillar(null);
    window.dispatchEvent(new CustomEvent("huuman:logCreated"));
  }, []);

  // ====================================================================
  // Render
  // ====================================================================

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden overscroll-none"
      style={{ backgroundColor: "#0a0a0b" }}
    >
      {/* ═══ Toast ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springs.snappy}
            className="fixed left-4 right-4 z-[60] flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{
              top: "max(env(safe-area-inset-top, 12px), 12px)",
              marginTop: 48,
              backgroundColor: "rgba(0,0,0,0.85)",
              border: `1px solid ${toast.color}30`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${toast.color}25` }}
            >
              <Check className="w-3 h-3" style={{ color: toast.color }} />
            </div>
            <span className="text-sm text-white/80">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Ambient orb ══════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
        style={{ contain: "strict" }}
      >
        <motion.div
          className="relative w-[600px] h-[600px]"
          animate={{ scale: ambientStyle.scale }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <div
            ref={orbRef}
            className="absolute inset-0 rounded-full blur-[100px]"
            style={{
              opacity: ambientStyle.opacity,
              background: `radial-gradient(circle, ${orbPrimary} 0%, ${orbSecondary} 40%, transparent 70%)`,
              willChange: "opacity",
              transform: "translateZ(0)",
            }}
          />
        </motion.div>
      </div>

      {/* ═══ Header ═══════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3 relative z-10">
        {/* Wordmark */}
        <span className="text-lg font-light tracking-tight text-white/40">
          huuman
        </span>

        {/* Center: mini rings (visible in chat mode when there are messages) */}
        <AnimatePresence>
          {!isHome && messages.length > 0 && (
            <MiniRings onClick={morphToHome} />
          )}
        </AnimatePresence>

        {/* Settings */}
        <motion.button
          whileTap={{ scale: 0.85, rotate: 90 }}
          transition={springs.tap}
          onClick={() => {
            setSettingsOpen(true);
            Haptics.light();
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
        >
          <Settings className="w-[18px] h-[18px]" />
        </motion.button>
      </header>

      {/* ═══ Content area — morphs between home and chat ═════════════ */}
      <div className="flex-1 overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          {isHome ? (
            /* ── Home mode: greeting hero + full dashboard ─────── */
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, y: -20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="h-full overflow-y-auto overscroll-contain scrollbar-hide"
              onScroll={(e) => handleContentScroll(e.currentTarget.scrollTop)}
            >
              {/* Greeting + rings + smart prompts */}
              <HomeContent
                onSend={(text) => handleSend(text)}
                onLog={handleDirectLog}
                onTimer={handleTimerStart}
                onScanner={handleScannerOpen}
              />

              {/* Full dashboard below */}
              <div className="mt-2">
                <CoreFiveView userId={userId} embedded />
              </div>
            </motion.div>
          ) : (
            /* ── Chat mode ──────────────────────────────────────── */
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
            >
              <div
                ref={scrollContainerRef}
                className={`h-full overflow-x-hidden [webkit-overflow-scrolling:touch] ${
                  messages.length === 0
                    ? "overflow-hidden"
                    : "overflow-y-auto overscroll-contain scrollbar-hide"
                }`}
                onScroll={(e) => handleContentScroll(e.currentTarget.scrollTop)}
              >
                {messages.length === 0 ? (
                  /* ── Chat empty state — minimal ──────────── */
                  <div className="flex flex-col items-center justify-center h-full px-5">
                    <p className="text-white/25 text-sm text-center">
                      What can I help with?
                    </p>
                  </div>
                ) : (
                  /* ── Messages ────────────────────────────── */
                  <div className="px-5 py-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        {...messageEntrance}
                        transition={springs.snappy}
                      >
                        <ChatMessage
                          message={message}
                          onTimerStart={() => handleTimerStart()}
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
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Shared input bar ════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 px-4 pt-2 relative z-10"
        style={{
          paddingBottom:
            "max(calc(env(safe-area-inset-bottom, 8px) + 8px), 16px)",
        }}
      >
        {/* Inline prompts — visible in chat mode with messages */}
        {!isHome &&
          messages.length > 0 &&
          suggestedPrompts.length > 0 &&
          !isLoading && (
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

        {/* Input row */}
        <div className="flex items-end gap-2">
          {/* Quick-action buttons — only in chat mode when no text */}
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={springs.snappy}
                className="flex gap-1.5 flex-shrink-0 overflow-hidden"
              >
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
                  <Camera
                    className="w-[18px] h-[18px]"
                    style={{ color: "#22c55e" }}
                  />
                </motion.button>

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
                  <Timer
                    className="w-[18px] h-[18px]"
                    style={{ color: "#06b6d4" }}
                  />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea */}
          <div
            className="relative flex-1 rounded-2xl border border-white/15 transition-[border-color,box-shadow,background-color] duration-300 focus-within:border-white/30 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder={isHome ? "Ask Eden..." : placeholder}
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

      {/* ═══ Overlays ════════════════════════════════════════════════ */}

      {/* Quick Log Modal */}
      {logPillar && (
        <QuickLogModal
          pillar={logPillar}
          config={PILLAR_CONFIGS[logPillar]}
          weekStart={weekStart}
          onClose={() => setLogPillar(null)}
          onSave={handleLogSaved}
        />
      )}

      {/* Breathwork Timer */}
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

      {/* Meal Scanner */}
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

      {/* Settings */}
      {settingsOpen && (
        <SettingsOverlay
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          isAdmin={isAdmin}
          initialCoachingStyle={coachingStyle}
          initialUnitSystem={unitSystem}
          initialGlucoseUnit={glucoseUnit}
          initialLipidsUnit={lipidsUnit}
        />
      )}
    </div>
  );
}
