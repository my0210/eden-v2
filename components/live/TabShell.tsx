"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Check } from "lucide-react";
import { ChatView } from "./ChatView";
import { CoreFiveView } from "@/components/v3/CoreFiveView";
import { SettingsOverlay } from "@/components/SettingsOverlay";
import { Haptics } from "@/lib/soul";
import {
  getWeekStart,
  getPrimeCoverage,
  type CoreFiveLog,
} from "@/lib/v3/coreFive";
import { springs } from "./interactions";
import { UnitSystem, GlucoseUnit, LipidsUnit } from "@/lib/types";

// ============================================================================
// Time-of-day orb color helper
// ============================================================================

function getTimeOfDayColor(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    // Morning: warm amber
    return "rgba(251,191,36,0.3)";
  }
  if (hour >= 12 && hour < 17) {
    // Afternoon: green (default)
    return "rgba(34,197,94,0.4)";
  }
  if (hour >= 17 && hour < 22) {
    // Evening: cool purple
    return "rgba(139,92,246,0.3)";
  }
  // Night: deep indigo
  return "rgba(99,102,241,0.2)";
}

function getTimeOfDaySecondary(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "rgba(245,158,11,0.15)";
  if (hour >= 12 && hour < 17) return "rgba(16,185,129,0.2)";
  if (hour >= 17 && hour < 22) return "rgba(109,40,217,0.15)";
  return "rgba(79,70,229,0.1)";
}

// ============================================================================
// Ambient orb intensity mapped to weekly coverage (0-5)
// ============================================================================

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
// Toast type
// ============================================================================

interface Toast {
  id: number;
  message: string;
  color: string;
}

// ============================================================================
// TabShell
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
  const [activeTab, setActiveTab] = useState(0); // 0 = chat, 1 = dashboard
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [primeCoverage, setPrimeCoverage] = useState(0);
  const [chatIsEmpty, setChatIsEmpty] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Coverage for ambient orb — reads from localStorage (no extra fetch)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const readCoverageFromCache = () => {
      try {
        const weekStart = getWeekStart(new Date());
        const cached = localStorage.getItem(`huuman_logs_${weekStart}`);
        if (cached) {
          const logs: CoreFiveLog[] = JSON.parse(cached);
          setPrimeCoverage(getPrimeCoverage(logs));
        }
      } catch { /* ignore */ }
    };

    readCoverageFromCache();

    // Re-read when logs change or app regains focus
    const onLogCreated = () => readCoverageFromCache();
    const onVisibility = () => {
      if (document.visibilityState === "visible") readCoverageFromCache();
    };

    window.addEventListener("huuman:logCreated", onLogCreated);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("huuman:logCreated", onLogCreated);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Post-log toast listener
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleToast = (e: CustomEvent<{ message: string; color: string }>) => {
      // Clear previous toast timeout
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

      setToast({ id: Date.now(), message: e.detail.message, color: e.detail.color });

      // Auto-dismiss after 2.5s
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 2500);
    };

    window.addEventListener("huuman:logToast", handleToast as EventListener);
    return () => {
      window.removeEventListener("huuman:logToast", handleToast as EventListener);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Scroll-based orb fade — direct DOM mutation, no re-render
  // ---------------------------------------------------------------------------
  const ambientStyle = getAmbientStyle(primeCoverage);

  const handleContentScroll = useCallback((scrollTop: number) => {
    if (!orbRef.current) return;
    const fade = Math.max(0.3, 1 - scrollTop / 400);
    orbRef.current.style.opacity = String(ambientStyle.opacity * fade);
  }, [ambientStyle.opacity]);

  // ---------------------------------------------------------------------------
  // Empty state callback from ChatView
  // ---------------------------------------------------------------------------
  const handleEmptyStateChange = useCallback((isEmpty: boolean) => {
    setChatIsEmpty(isEmpty);
  }, []);

  // Switch to dashboard tab (called from ProactiveGreeting "View dashboard" link)
  const handleSwitchToDashboard = useCallback(() => {
    setActiveTab(1);
    Haptics.light();
  }, []);

  // Time-of-day orb gradient
  const orbPrimary = getTimeOfDayColor();
  const orbSecondary = getTimeOfDaySecondary();

  // Show tab dots only when chat has messages (not during greeting)
  const showTabDots = !chatIsEmpty || activeTab === 1;

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden overscroll-none"
      style={{ backgroundColor: "#0a0a0b" }}
    >
      {/* ================================================================= */}
      {/* Post-log toast                                                    */}
      {/* ================================================================= */}
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
              boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
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

      {/* ================================================================= */}
      {/* Shared ambient orb — GPU-composited layer, time-tinted            */}
      {/* ================================================================= */}
      <div className="orb-container fixed inset-0 flex items-center justify-center pointer-events-none z-0" style={{ contain: "strict" }}>
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

      {/* ================================================================= */}
      {/* Shared header                                                     */}
      {/* ================================================================= */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3 relative z-10">
        {/* Wordmark */}
        <span className="text-lg font-light tracking-tight text-white/40">
          huuman
        </span>

        {/* Tab indicator dots — hidden when chat is in greeting state */}
        <AnimatePresence>
          {showTabDots && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springs.tap}
              className="flex items-center gap-2"
            >
              {[0, 1].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => {
                    if (activeTab !== tab) {
                      setActiveTab(tab);
                      Haptics.light();
                    }
                  }}
                  whileTap={{ scale: 0.8 }}
                  className="relative p-1"
                >
                  <motion.div
                    layout
                    animate={{
                      width: activeTab === tab ? 16 : 6,
                      opacity: activeTab === tab ? 0.9 : 0.25,
                    }}
                    transition={springs.tap}
                    className="h-[5px] rounded-full bg-white"
                  />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings — rotates 90° on tap */}
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

      {/* ================================================================= */}
      {/* Tab content — horizontal tray, no drag                            */}
      {/* ================================================================= */}
      <div
        className="flex-1 overflow-hidden relative z-10"
      >
        <motion.div
          className="flex h-full"
          style={{ width: "200%" }}
          animate={{ x: activeTab === 0 ? "0%" : "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Chat tab */}
          <div
            className="h-full w-1/2 flex-shrink-0"
          >
            <ChatView
              onScroll={activeTab === 0 ? handleContentScroll : undefined}
              onEmptyStateChange={handleEmptyStateChange}
              onSwitchTab={handleSwitchToDashboard}
            />
          </div>

          {/* Dashboard tab */}
          <div
            className="h-full w-1/2 flex-shrink-0 overflow-y-auto overscroll-contain"
            onScroll={(e) =>
              activeTab === 1 &&
              handleContentScroll(e.currentTarget.scrollTop)
            }
          >
            <CoreFiveView userId={userId} embedded />
          </div>
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Settings overlay — only mounted when open                        */}
      {/* ================================================================= */}
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
