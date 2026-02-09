"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw } from "lucide-react";
import { Haptics, Sounds } from "@/lib/soul";
import { getWeekStart } from "@/lib/v3/coreFive";

interface BreathworkTimerProps {
  /** Duration in minutes */
  duration?: number;
  onComplete?: () => void;
  onClose: () => void;
}

type Phase = "inhale" | "hold" | "exhale";
type TimerState = "idle" | "running" | "paused" | "complete";

const PHASE_DURATIONS: Record<Phase, number> = {
  inhale: 4,
  hold: 4,
  exhale: 6,
};

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "Breathe in",
  hold: "Hold",
  exhale: "Breathe out",
};

const CYCLE_DURATION = PHASE_DURATIONS.inhale + PHASE_DURATIONS.hold + PHASE_DURATIONS.exhale; // 14s

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BreathworkTimer({ duration = 5, onComplete, onClose }: BreathworkTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(duration * 60);
  const [currentPhase, setCurrentPhase] = useState<Phase>("inhale");
  const [phaseProgress, setPhaseProgress] = useState(0); // 0-1
  const [saving, setSaving] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(duration);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, []);

  // Breathing phase cycle
  useEffect(() => {
    if (timerState !== "running") {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      return;
    }

    const phases: Phase[] = ["inhale", "hold", "exhale"];
    let phaseIndex = 0;

    const startPhase = () => {
      const phase = phases[phaseIndex % 3];
      setCurrentPhase(phase);
      setPhaseProgress(0);
      phaseStartRef.current = Date.now();
      Haptics.light();

      const phaseDuration = PHASE_DURATIONS[phase] * 1000;

      phaseTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - phaseStartRef.current;
        const progress = Math.min(elapsed / phaseDuration, 1);
        setPhaseProgress(progress);

        if (progress >= 1) {
          if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
          phaseIndex++;
          startPhase();
        }
      }, 50);
    };

    startPhase();

    return () => {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, [timerState]);

  // Countdown timer
  useEffect(() => {
    if (timerState !== "running") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimerState("complete");
          Haptics.success();
          Sounds.playChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  const handleStart = () => {
    setRemainingSeconds(selectedDuration * 60);
    setTimerState("running");
    Haptics.medium();
  };

  const handlePause = () => {
    setTimerState("paused");
    Haptics.light();
  };

  const handleResume = () => {
    setTimerState("running");
    Haptics.light();
  };

  const handleReset = () => {
    setTimerState("idle");
    setRemainingSeconds(selectedDuration * 60);
    setCurrentPhase("inhale");
    setPhaseProgress(0);
    Haptics.light();
  };

  const handleSaveAndClose = useCallback(async () => {
    setSaving(true);
    try {
      const weekStart = getWeekStart(new Date());
      const res = await fetch("/api/v3/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillar: "mindfulness",
          value: selectedDuration,
          details: { type: "breathwork" },
          weekStart,
        }),
      });

      if (res.ok) {
        Haptics.success();
        Sounds.playSuccess();
        onComplete?.();
      }
    } catch (error) {
      console.error("Failed to log breathwork:", error);
    } finally {
      setSaving(false);
      onClose();
    }
  }, [selectedDuration, onComplete, onClose]);

  // Breathing circle scale: grows on inhale, stays on hold, shrinks on exhale
  const getCircleScale = () => {
    if (timerState !== "running" && timerState !== "paused") return 1;

    switch (currentPhase) {
      case "inhale":
        return 0.6 + phaseProgress * 0.4; // 0.6 -> 1.0
      case "hold":
        return 1.0;
      case "exhale":
        return 1.0 - phaseProgress * 0.4; // 1.0 -> 0.6
      default:
        return 1;
    }
  };

  const totalSeconds = selectedDuration * 60;
  const elapsed = totalSeconds - remainingSeconds;
  const overallProgress = totalSeconds > 0 ? elapsed / totalSeconds : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Timer content */}
      <div className="flex flex-col items-center gap-8">
        {/* Breathing circle */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Outer ring (progress) */}
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 224 224">
            <circle
              cx="112"
              cy="112"
              r="106"
              fill="none"
              stroke="rgba(6, 182, 212, 0.1)"
              strokeWidth="4"
            />
            <circle
              cx="112"
              cy="112"
              r="106"
              fill="none"
              stroke="rgba(6, 182, 212, 0.6)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 106}`}
              strokeDashoffset={`${2 * Math.PI * 106 * (1 - overallProgress)}`}
              className="transition-all duration-1000"
            />
          </svg>

          {/* Breathing circle (pulsing) */}
          <motion.div
            className="rounded-full"
            animate={{
              scale: getCircleScale(),
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
            }}
            style={{
              width: 160,
              height: 160,
              background: "radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(6, 182, 212, 0.05) 70%, transparent 100%)",
              border: "1px solid rgba(6, 182, 212, 0.2)",
            }}
          />

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-light text-white tabular-nums tracking-tight">
              {formatTime(remainingSeconds)}
            </span>
            {timerState === "running" && (
              <motion.span
                key={currentPhase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-cyan-400/80 mt-2 font-medium"
              >
                {PHASE_LABELS[currentPhase]}
              </motion.span>
            )}
          </div>
        </div>

        {/* Duration selector (only when idle) */}
        {timerState === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            {[3, 5, 10, 15].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSelectedDuration(mins);
                  setRemainingSeconds(mins * 60);
                  Haptics.light();
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedDuration === mins
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
                }`}
              >
                {mins} min
              </button>
            ))}
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          {timerState === "idle" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              <Play className="w-7 h-7 ml-0.5" />
            </motion.button>
          )}

          {timerState === "running" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePause}
              className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/15 transition-colors"
            >
              <Pause className="w-7 h-7" />
            </motion.button>
          )}

          {timerState === "paused" && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleResume}
                className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                <Play className="w-7 h-7 ml-0.5" />
              </motion.button>
            </>
          )}

          {timerState === "complete" && (
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <p className="text-lg font-medium text-cyan-400 mb-1">Session complete</p>
                <p className="text-sm text-white/40">{selectedDuration} minutes of breathwork</p>
              </motion.div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm text-white/50 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleSaveAndClose}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-black bg-cyan-400 hover:bg-cyan-300 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Log & Close"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtle label */}
      {timerState !== "complete" && (
        <div className="absolute bottom-10 text-xs text-white/20 tracking-wider uppercase">
          breathwork
        </div>
      )}
    </motion.div>
  );
}
