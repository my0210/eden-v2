"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Heart,
  Dumbbell,
  Moon,
  Brain,
  Activity,
  Target,
  Camera,
} from "lucide-react";
import {
  PILLARS,
  PILLAR_CONFIGS,
  type Pillar,
  type CoreFiveLog,
  getPillarProgress,
  getPrimeCoverage,
  getWeekStart,
} from "@/lib/v3/coreFive";
import { springs, tapScale } from "./interactions";
import { Haptics } from "@/lib/soul";

// ============================================================================
// Contextual Greeting
// ============================================================================

function getGreeting(logs: CoreFiveLog[], coverage: number): string {
  const hour = new Date().getHours();
  const dow = new Date().getDay();
  const daysLeft = dow === 0 ? 1 : 8 - dow;

  if (coverage === 5) return "You're in prime this week.\nEvery pillar hit.";

  if (coverage === 4) {
    const missing = PILLARS.find(
      (p) => getPillarProgress(logs, p) < PILLAR_CONFIGS[p].weeklyTarget
    );
    if (missing) {
      const c = PILLAR_CONFIGS[missing];
      const rem = c.weeklyTarget - getPillarProgress(logs, missing);
      return `Almost there.\n${rem} ${c.unit} of ${c.name.toLowerCase()} to go.`;
    }
  }

  if (dow === 1 && hour < 12) return "Fresh week.\nLet's get after it.";

  if (dow === 0 || dow === 6) {
    if (coverage >= 3)
      return `${coverage}/5 pillars hit.\nGood weekend to close the gaps.`;
    return "Weekend mode.\nWhat do you want to focus on?";
  }

  if (hour >= 5 && hour < 12) {
    const today = new Date().toISOString().split("T")[0];
    const sleepLogged = logs.some(
      (l) => l.pillar === "sleep" && l.loggedAt.startsWith(today)
    );
    if (
      !sleepLogged &&
      getPillarProgress(logs, "sleep") < PILLAR_CONFIGS.sleep.weeklyTarget
    )
      return "Morning.\nHow'd you sleep?";
    return `Morning.\n${coverage}/5 this week so far.`;
  }

  if (hour >= 12 && hour < 17) {
    if (daysLeft <= 3 && coverage < 3)
      return `${daysLeft} days left.\n${coverage}/5 pillars hit.`;
    return `${coverage}/5 this week.\nWhat's next?`;
  }

  if (hour >= 17) {
    const mindfulness = getPillarProgress(logs, "mindfulness");
    if (mindfulness < PILLAR_CONFIGS.mindfulness.weeklyTarget)
      return "Evening.\nGood time to wind down.";
    return `${coverage}/5 this week.\nWrapping up the day?`;
  }

  return `${coverage}/5 pillars this week.\nWhat can I help with?`;
}

// ============================================================================
// Smart Prompts
// ============================================================================

interface SmartPrompt {
  text: string;
  pillar?: Pillar;
  icon: React.ElementType;
}

function getSmartPrompts(logs: CoreFiveLog[]): SmartPrompt[] {
  const prompts: SmartPrompt[] = [];
  for (const pillar of PILLARS) {
    const config = PILLAR_CONFIGS[pillar];
    const current = getPillarProgress(logs, pillar);
    if (current >= config.weeklyTarget) continue;
    if (pillar === "cardio" && current === 0)
      prompts.push({ text: "Log a walk or run", pillar: "cardio", icon: Heart });
    else if (pillar === "sleep" && current === 0)
      prompts.push({ text: "Log last night's sleep", pillar: "sleep", icon: Moon });
    else if (pillar === "strength" && current < config.weeklyTarget)
      prompts.push({ text: "Give me a workout", pillar: "strength", icon: Dumbbell });
    else if (pillar === "clean_eating" && current < config.weeklyTarget)
      prompts.push({ text: "Scan my meal", pillar: "clean_eating", icon: Camera });
    else if (pillar === "mindfulness" && current === 0)
      prompts.push({ text: "Start breathwork", pillar: "mindfulness", icon: Brain });
  }
  const metCount = PILLARS.filter(
    (p) => getPillarProgress(logs, p) >= PILLAR_CONFIGS[p].weeklyTarget
  ).length;
  if (metCount >= 4)
    prompts.unshift({ text: "What's left to hit all 5?", icon: Target });
  else if (metCount === 0 && logs.length === 0)
    return [
      { text: "How's my week looking?", icon: Activity },
      { text: "Log 30 min of cardio", pillar: "cardio", icon: Heart },
      { text: "Give me a quick workout", pillar: "strength", icon: Dumbbell },
      { text: "What should I focus on?", icon: Target },
    ];
  else prompts.unshift({ text: "How's my week looking?", icon: Activity });
  return prompts.slice(0, 4);
}

// ============================================================================
// Pillar Ring
// ============================================================================

function PillarRing({
  pillar,
  pct,
  met,
  onTap,
}: {
  pillar: Pillar;
  pct: number;
  met: boolean;
  onTap: () => void;
}) {
  const config = PILLAR_CONFIGS[pillar];
  const size = 48;
  const sw = 3;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const label =
    config.name.length > 5 ? config.name.slice(0, 4) : config.name;

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      transition={springs.tap}
      onClick={() => {
        Haptics.light();
        onTap();
      }}
      className="flex flex-col items-center gap-1.5 focus:outline-none"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="absolute inset-0 -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`${config.color}18`}
            strokeWidth={sw}
          />
        </svg>
        <svg
          width={size}
          height={size}
          className="absolute inset-0 -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={config.color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            opacity={met ? 1 : 0.5}
            className="transition-[stroke-dashoffset,opacity] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {met ? (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke={config.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : pct > 0 ? (
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{ color: `${config.color}90` }}
            >
              {Math.round(pct)}
            </span>
          ) : null}
        </div>
      </div>
      <span
        className="text-[10px] font-medium transition-colors duration-300"
        style={{ color: met ? config.color : `${config.color}60` }}
      >
        {label}
      </span>
    </motion.button>
  );
}

// ============================================================================
// Today summary
// ============================================================================

function getTodaySummary(logs: CoreFiveLog[]): string {
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((l) => l.loggedAt.startsWith(today));

  if (todayLogs.length === 0) return "Nothing logged yet today";

  const parts: string[] = [];
  for (const log of todayLogs) {
    const config = PILLAR_CONFIGS[log.pillar];
    if (log.pillar === "clean_eating") {
      parts.push("on-plan meal");
    } else if (log.pillar === "strength") {
      parts.push(`${log.value} session${log.value > 1 ? "s" : ""}`);
    } else {
      parts.push(`${log.value}${config.unit} ${config.name.toLowerCase()}`);
    }
  }
  return `Today: ${parts.join(", ")}`;
}

// ============================================================================
// HomeContent
// ============================================================================

interface HomeContentProps {
  onSend: (text: string) => void;
  onLog?: (pillar: Pillar) => void;
  onTimer?: () => void;
  onScanner?: () => void;
}

export function HomeContent({
  onSend,
  onLog,
  onTimer,
  onScanner,
}: HomeContentProps) {
  const [logs, setLogs] = useState<CoreFiveLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const weekStart = getWeekStart(new Date());
    const cacheKey = `huuman_logs_${weekStart}`;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setLogs(JSON.parse(cached));
        setLoaded(true);
        return;
      }
    } catch {
      /* ignore */
    }

    fetch(`/api/v3/log?week_start=${weekStart}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Refresh when logs change
  useEffect(() => {
    const refresh = () => {
      const weekStart = getWeekStart(new Date());
      const cacheKey = `huuman_logs_${weekStart}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) setLogs(JSON.parse(cached));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("huuman:logCreated", refresh);
    return () => window.removeEventListener("huuman:logCreated", refresh);
  }, []);

  const coverage = useMemo(() => getPrimeCoverage(logs), [logs]);
  const greeting = useMemo(() => getGreeting(logs, coverage), [logs, coverage]);
  const prompts = useMemo(() => getSmartPrompts(logs), [logs]);
  const todaySummary = useMemo(() => getTodaySummary(logs), [logs]);
  const pillarData = useMemo(
    () =>
      PILLARS.map((pillar) => {
        const current = getPillarProgress(logs, pillar);
        const target = PILLAR_CONFIGS[pillar].weeklyTarget;
        return {
          pillar,
          pct: target > 0 ? (current / target) * 100 : 0,
          met: current >= target,
        };
      }),
    [logs]
  );

  const handleRingTap = (pillar: Pillar) => {
    if (pillar === "mindfulness" && onTimer) {
      onTimer();
    } else if (pillar === "clean_eating" && onScanner) {
      onScanner();
    } else if (onLog) {
      onLog(pillar);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-8 pb-4">
      <div className="flex flex-col items-center">
        {/* Date + Coverage */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, ...springs.snappy }}
          className="text-[11px] text-white/25 uppercase tracking-widest font-medium mb-5"
        >
          {format(new Date(), "EEEE")} &mdash; {coverage} of 5 this week
        </motion.p>

        {/* Greeting */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...springs.snappy }}
          className="text-xl text-white/70 font-medium text-center max-w-[320px] leading-relaxed mb-7 whitespace-pre-line"
        >
          {greeting}
        </motion.p>

        {/* Pillar rings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, ...springs.gentle }}
          className="flex items-start justify-center gap-4 mb-3"
        >
          {pillarData.map(({ pillar, pct, met }) => (
            <PillarRing
              key={pillar}
              pillar={pillar}
              pct={pct}
              met={met}
              onTap={() => handleRingTap(pillar)}
            />
          ))}
        </motion.div>

        {/* Today summary */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, ...springs.snappy }}
          className="text-[11px] text-white/20 text-center mb-8"
        >
          {todaySummary}
        </motion.p>

        {/* Smart prompts — 2x2 grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-[340px]">
          {prompts.map((prompt, i) => {
            const Icon = prompt.icon;
            const color = prompt.pillar
              ? PILLAR_CONFIGS[prompt.pillar].color
              : undefined;

            return (
              <motion.button
                key={prompt.text}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05, ...springs.snappy }}
                whileTap={tapScale}
                onClick={() => {
                  Haptics.light();
                  onSend(prompt.text);
                }}
                className="relative py-3.5 px-4 rounded-xl text-left transition-colors duration-150 hover:bg-white/[0.07] overflow-hidden"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderLeftWidth: color ? 2 : 1,
                  borderLeftColor: color || "rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: color || "rgba(255,255,255,0.3)" }}
                  />
                  <span className="text-[13px] text-white/55 leading-snug">
                    {prompt.text}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
