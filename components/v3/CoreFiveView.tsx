"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { startOfWeek, format, endOfWeek, addWeeks } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { CoreFiveCard } from "./CoreFiveCard";
import { QuickLogModal } from "./QuickLogModal";
import { TrendView } from "./TrendView";
import { PillarDetailDrawer } from "./PillarDetailDrawer";
import { V3Onboarding } from "./V3Onboarding";
import { StreakHero } from "./StreakHero";
import { ProgressPhotoSection } from "./ProgressPhotoSection";
import { BreathworkTimer } from "@/components/BreathworkTimer";
import { MealScanner } from "@/components/MealScanner";
import { generateNudge, type Nudge } from "@/lib/v3/nudgeEngine";
import { 
  PILLARS, 
  PILLAR_CONFIGS, 
  Pillar, 
  CoreFiveLog,
  getPillarProgress,
  getPrimeCoverage,
  getWeekStart,
} from "@/lib/v3/coreFive";

interface CoreFiveViewProps {
  userId: string;
}

// Ambient orb opacity/scale mapped to coverage
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

// localStorage cache helpers
function getCachedLogs(weekStart: string): CoreFiveLog[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(`huuman_logs_${weekStart}`);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

function setCachedLogs(weekStart: string, logs: CoreFiveLog[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(`huuman_logs_${weekStart}`, JSON.stringify(logs)); } catch {}
}

function getCachedStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    const cached = localStorage.getItem("huuman_streak");
    return cached ? parseInt(cached, 10) : 0;
  } catch { return 0; }
}

function setCachedStreak(streak: number) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("huuman_streak", String(streak)); } catch {}
}

export function CoreFiveView({ userId }: CoreFiveViewProps) {
  const [logs, setLogs] = useState<CoreFiveLog[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [detailPillar, setDetailPillar] = useState<Pillar | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showBreathworkTimer, setShowBreathworkTimer] = useState(false);
  const [showMealScanner, setShowMealScanner] = useState(false);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
  const [weekOffset, setWeekOffset] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Streak data (initialized from cache for instant display)
  const [streak, setStreak] = useState(() => getCachedStreak());
  
  // Subtle card glow on completion
  const [justCompletedPillar, setJustCompletedPillar] = useState<Pillar | null>(null);
  const prevCoverageRef = useRef<number>(0);

  // Skip transitions when switching weeks (snap instantly)
  const [skipTransition, setSkipTransition] = useState(false);

  // Track if initial load has happened
  const hasLoadedOnce = useRef(false);

  // Swipe gesture tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swiping = useRef(false);

  // Check onboarding status on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const onboarded = localStorage.getItem("huuman_v3_onboarded");
      if (!onboarded) {
        setShowOnboarding(true);
      }
    }
  }, []);

  const isCurrentWeek = weekOffset === 0;

  // Compute week dates from offset
  const { weekStart, weekEnd, weekStartStr } = useMemo(() => {
    const today = new Date();
    const base = addWeeks(today, weekOffset);
    const ws = startOfWeek(base, { weekStartsOn: 1 });
    const we = endOfWeek(base, { weekStartsOn: 1 });
    const wsStr = getWeekStart(base);
    return { weekStart: ws, weekEnd: we, weekStartStr: wsStr };
  }, [weekOffset]);

  // Navigate weeks
  const goBack = useCallback(() => {
    setWeekOffset(prev => Math.max(prev - 1, -12));
  }, []);

  const goForward = useCallback(() => {
    setWeekOffset(prev => Math.min(prev + 1, 0));
  }, []);

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant and significant
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) {
        // Swipe right = go to previous week
        goBack();
      } else {
        // Swipe left = go to next week
        goForward();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [goBack, goForward]);

  // Fetch logs for the selected week (stale-while-revalidate)
  useEffect(() => {
    setSkipTransition(true);

    // Instantly show cached data if available
    const cached = getCachedLogs(weekStartStr);
    if (cached) {
      setLogs(cached);
      prevCoverageRef.current = getPrimeCoverage(cached);
      setInitialLoading(false);
      hasLoadedOnce.current = true;
    } else if (!hasLoadedOnce.current) {
      setInitialLoading(true);
    }

    // Fetch fresh data in background
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/v3/log?week_start=${weekStartStr}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedLogs: CoreFiveLog[] = data.logs || [];
          setLogs(fetchedLogs);
          prevCoverageRef.current = getPrimeCoverage(fetchedLogs);
          setCachedLogs(weekStartStr, fetchedLogs);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setInitialLoading(false);
        hasLoadedOnce.current = true;
        requestAnimationFrame(() => setSkipTransition(false));
      }
    }
    fetchLogs();
  }, [weekStartStr]);

  // Fetch streak data on mount
  useEffect(() => {
    async function fetchStreak() {
      try {
        const res = await fetch("/api/v3/log/history?weeks=12");
        if (res.ok) {
          const data = await res.json();
          const allLogs: CoreFiveLog[] = data.logs || [];
          
          let calculatedStreak = 0;
          for (let i = 0; i < 12; i++) {
            const weekDate = addWeeks(new Date(), -i);
            const ws = getWeekStart(weekDate);
            const weekLogs = allLogs.filter((l: CoreFiveLog) => l.weekStart === ws);
            const coverage = getPrimeCoverage(weekLogs);
            
            if (coverage >= 4) {
              calculatedStreak++;
            } else {
              if (i === 0) continue;
              break;
            }
          }
          
          setStreak(calculatedStreak);
          setCachedStreak(calculatedStreak);
        }
      } catch (error) {
        console.error("Failed to fetch streak:", error);
      }
    }
    fetchStreak();
  }, []);

  const primeCoverage = getPrimeCoverage(logs);
  const ambientStyle = getAmbientStyle(primeCoverage);

  // Generate contextual nudge based on progress + time, filtering dismissed ones
  const nudge = useMemo(() => {
    if (!isCurrentWeek) return null;
    const candidate = generateNudge(logs);
    if (candidate && dismissedNudges.has(candidate.id)) return null;
    return candidate;
  }, [logs, isCurrentWeek, dismissedNudges]);

  // Detect when a log tips a pillar over its target (for subtle card glow)
  const handleLogComplete = useCallback((newLog: CoreFiveLog) => {
    const updatedLogs = [...logs, newLog];

    const pillar = newLog.pillar;
    const prevProgress = getPillarProgress(logs, pillar);
    const newProgress = getPillarProgress(updatedLogs, pillar);
    const target = PILLAR_CONFIGS[pillar].weeklyTarget;
    
    if (prevProgress < target && newProgress >= target) {
      setJustCompletedPillar(pillar);
      setTimeout(() => setJustCompletedPillar(null), 1000);
    }

    setLogs(updatedLogs);
    prevCoverageRef.current = getPrimeCoverage(updatedLogs);
    setCachedLogs(weekStartStr, updatedLogs);
    setSelectedPillar(null);
  }, [logs, weekStartStr]);

  const handleLogSaved = (newLog: CoreFiveLog) => {
    handleLogComplete(newLog);
  };

  // Quick-log handler: POST directly without modal
  const handleQuickLog = useCallback(async (pillar: Pillar, value: number) => {
    try {
      const res = await fetch("/api/v3/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillar,
          value,
          weekStart: weekStartStr,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        handleLogComplete(data.log);
      }
    } catch (error) {
      console.error("Quick log failed:", error);
    }
  }, [weekStartStr, handleLogComplete]);

  const handleLogDeleted = (logId: string) => {
    const updatedLogs = logs.filter(l => l.id !== logId);
    setLogs(updatedLogs);
    prevCoverageRef.current = getPrimeCoverage(updatedLogs);
    setCachedLogs(weekStartStr, updatedLogs);
  };

  const handleLogUpdated = (updatedLog: CoreFiveLog) => {
    const updatedLogs = logs.map(l => l.id === updatedLog.id ? updatedLog : l);
    setLogs(updatedLogs);
    prevCoverageRef.current = getPrimeCoverage(updatedLogs);
    setCachedLogs(weekStartStr, updatedLogs);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem("huuman_v3_onboarded", "true");
    setShowOnboarding(false);
  };

  // Onboarding gate
  if (showOnboarding) {
    return <V3Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Only show spinner on very first load
  if (initialLoading) {
    return (
      <div className="px-6 py-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Dynamic ambient orb - responds to coverage */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div 
          className={`relative w-[800px] h-[800px] ${skipTransition ? "" : "transition-all duration-[2000ms] ease-out"}`}
          style={{ transform: `scale(${ambientStyle.scale})` }}
        >
          <div 
            className={`absolute inset-0 rounded-full blur-[150px] ${skipTransition ? "" : "transition-opacity duration-[2000ms] ease-out"}`}
            style={{
              opacity: ambientStyle.opacity,
              background: "radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)",
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          <TrendView
            key="history"
            userId={userId}
            onBack={() => setShowHistory(false)}
          />
        ) : (
          <motion.div 
            key="week-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 py-4 relative z-10"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Week Header with Navigation */}
            <div className="mb-6 flex items-center justify-between">
              <div 
                onClick={() => setShowHistory(true)}
                className="cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-white/90 group-hover:text-white transition-colors">
                    {isCurrentWeek ? "This Week" : format(weekStart, "MMM d")}
                  </h1>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-sm text-white/40 font-medium group-hover:text-white/60 transition-colors">
                  {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                <button
                  onClick={goBack}
                  disabled={weekOffset <= -12}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="w-px h-4 bg-white/10" />

                <button
                  onClick={goForward}
                  disabled={isCurrentWeek}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Streak Hero Banner */}
            <StreakHero
              logs={logs}
              streak={streak}
              skipTransition={skipTransition}
            />

            {/* Proactive Nudge Banner */}
            <AnimatePresence>
              {nudge && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div
                    className="rounded-2xl px-4 py-3.5 flex items-center gap-3 border"
                    style={{
                      backgroundColor: nudge.pillar
                        ? `${PILLAR_CONFIGS[nudge.pillar].color}08`
                        : "rgba(255,255,255,0.03)",
                      borderColor: nudge.pillar
                        ? `${PILLAR_CONFIGS[nudge.pillar].color}20`
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <p className="text-sm text-white/70 flex-1 leading-snug">{nudge.message}</p>
                    {nudge.action && nudge.actionLabel && (
                      <button
                        onClick={() => {
                          if (nudge.action === "timer") setShowBreathworkTimer(true);
                          else if (nudge.action === "scan") setShowMealScanner(true);
                          else if (nudge.action === "log" && nudge.pillar) setSelectedPillar(nudge.pillar);
                          else if (nudge.action === "chat") {
                            // Dispatch event to open chat with a message
                            window.dispatchEvent(
                              new CustomEvent("huuman:askAboutItem", {
                                detail: { question: nudge.actionLabel },
                              })
                            );
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                        style={{
                          backgroundColor: nudge.pillar
                            ? `${PILLAR_CONFIGS[nudge.pillar].color}20`
                            : "rgba(255,255,255,0.1)",
                          color: nudge.pillar
                            ? PILLAR_CONFIGS[nudge.pillar].color
                            : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {nudge.actionLabel}
                      </button>
                    )}
                    <button
                      onClick={() => setDismissedNudges(prev => new Set(prev).add(nudge.id))}
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Core Five Cards */}
            <div className="grid gap-4">
              {PILLARS.map(pillar => (
                <CoreFiveCard
                  key={pillar}
                  config={PILLAR_CONFIGS[pillar]}
                  current={getPillarProgress(logs, pillar)}
                  onLogClick={() => setSelectedPillar(pillar)}
                  onQuickLog={isCurrentWeek ? (value) => handleQuickLog(pillar, value) : undefined}
                  onCardClick={() => setDetailPillar(pillar)}
                  onTimerClick={pillar === "mindfulness" && isCurrentWeek ? () => setShowBreathworkTimer(true) : undefined}
                  onScanClick={pillar === "clean_eating" && isCurrentWeek ? () => setShowMealScanner(true) : undefined}
                  readOnly={!isCurrentWeek}
                  justCompleted={justCompletedPillar === pillar}
                />
              ))}
            </div>

            {/* Progress Photos Section */}
            <ProgressPhotoSection userId={userId} />

            {/* Quick Log Modal */}
            {selectedPillar && (
              <QuickLogModal
                pillar={selectedPillar}
                config={PILLAR_CONFIGS[selectedPillar]}
                weekStart={weekStartStr}
                onClose={() => setSelectedPillar(null)}
                onSave={handleLogSaved}
              />
            )}

            {/* Pillar Detail Drawer */}
            {detailPillar && (
              <PillarDetailDrawer
                pillar={detailPillar}
                config={PILLAR_CONFIGS[detailPillar]}
                logs={logs.filter(l => l.pillar === detailPillar)}
                weekStart={weekStartStr}
                readOnly={!isCurrentWeek}
                onClose={() => setDetailPillar(null)}
                onDelete={handleLogDeleted}
                onUpdate={handleLogUpdated}
                onLogNew={() => {
                  setDetailPillar(null);
                  setSelectedPillar(detailPillar);
                }}
              />
            )}

            {/* Breathwork Timer */}
            <AnimatePresence>
              {showBreathworkTimer && (
                <BreathworkTimer
                  onComplete={() => {
                    // Refresh logs after timer auto-logs
                    fetch(`/api/v3/log?week_start=${weekStartStr}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.logs) {
                          setLogs(data.logs);
                          setCachedLogs(weekStartStr, data.logs);
                        }
                      })
                      .catch(() => {});
                  }}
                  onClose={() => setShowBreathworkTimer(false)}
                />
              )}
            </AnimatePresence>

            {/* Meal Scanner */}
            <AnimatePresence>
              {showMealScanner && (
                <MealScanner
                  onComplete={() => {
                    // Refresh logs after meal scan auto-logs
                    fetch(`/api/v3/log?week_start=${weekStartStr}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.logs) {
                          setLogs(data.logs);
                          setCachedLogs(weekStartStr, data.logs);
                        }
                      })
                      .catch(() => {});
                  }}
                  onClose={() => setShowMealScanner(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
