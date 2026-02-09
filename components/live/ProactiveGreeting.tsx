"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
// Contextual Greeting Generator
// ============================================================================

function getGreeting(logs: CoreFiveLog[], coverage: number): string {
  const hour = new Date().getHours();
  const dow = new Date().getDay(); // 0=Sun
  const daysLeft = dow === 0 ? 1 : 8 - dow;

  if (coverage === 5) return "You're in prime this week. Every pillar hit.";

  if (coverage === 4) {
    const missing = PILLARS.find(
      (p) => getPillarProgress(logs, p) < PILLAR_CONFIGS[p].weeklyTarget
    );
    if (missing) {
      const c = PILLAR_CONFIGS[missing];
      const rem = c.weeklyTarget - getPillarProgress(logs, missing);
      return `Almost there. ${rem} ${c.unit} of ${c.name.toLowerCase()} to go.`;
    }
  }

  if (dow === 1 && hour < 12) return "Fresh week. Let's get after it.";

  if (dow === 0 || dow === 6) {
    if (coverage >= 3) return `${coverage}/5 pillars hit. Good weekend to close the gaps.`;
    return "Weekend mode. What do you want to focus on?";
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
      return "Morning. How'd you sleep?";
    return `Morning. ${coverage}/5 this week so far.`;
  }

  if (hour >= 12 && hour < 17) {
    if (daysLeft <= 3 && coverage < 3)
      return `${daysLeft} days left. ${coverage}/5 pillars hit. Let's make a plan.`;
    return `${coverage}/5 this week. What's next?`;
  }

  if (hour >= 17) {
    const mindfulness = getPillarProgress(logs, "mindfulness");
    if (mindfulness < PILLAR_CONFIGS.mindfulness.weeklyTarget)
      return "Evening. Good time to wind down with some breathwork.";
    return `${coverage}/5 this week. Wrapping up the day?`;
  }

  return `${coverage}/5 pillars this week. What can I help with?`;
}

// ============================================================================
// Smart Prompt Generation
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
  else if (metCount === 0 && logs.length === 0) return DEFAULT_PROMPTS;
  else prompts.unshift("How's my week looking?");
  return prompts.slice(0, 4);
}

// ============================================================================
// Compact Pillar Ring
// ============================================================================

function MiniRing({
  pillar,
  pct,
  met,
}: {
  pillar: Pillar;
  pct: number;
  met: boolean;
}) {
  const config = PILLAR_CONFIGS[pillar];
  const size = 32;
  const sw = 2.5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`${config.color}18`}
          strokeWidth={sw}
        />
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
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {met && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke={config.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ProactiveGreeting
// ============================================================================

interface ProactiveGreetingProps {
  onSend: (text: string) => void;
}

export function ProactiveGreeting({ onSend }: ProactiveGreetingProps) {
  const [logs, setLogs] = useState<CoreFiveLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const weekStart = getWeekStart(new Date());
    fetch(`/api/v3/log?week_start=${weekStart}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const coverage = useMemo(() => getPrimeCoverage(logs), [logs]);
  const greeting = useMemo(() => getGreeting(logs, coverage), [logs, coverage]);
  const prompts = useMemo(() => getSmartPrompts(logs), [logs]);
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

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col justify-end h-full px-5 pb-4"
    >
      <div className="flex flex-col items-center mb-8">
        {/* Compact pillar rings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, ...springs.gentle }}
          className="flex items-center gap-3 mb-5"
        >
          {pillarData.map(({ pillar, pct, met }) => (
            <MiniRing key={pillar} pillar={pillar} pct={pct} met={met} />
          ))}
        </motion.div>

        {/* Contextual greeting */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...springs.snappy }}
          className="text-white/50 text-sm text-center max-w-[280px] leading-relaxed"
        >
          {greeting}
        </motion.p>
      </div>

      {/* Smart prompts */}
      <div className="grid grid-cols-2 gap-2">
        {prompts.map((prompt, i) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05, ...springs.snappy }}
            whileTap={tapScale}
            onClick={() => {
              Haptics.light();
              onSend(prompt);
            }}
            className="px-4 py-3.5 rounded-2xl text-left text-[13px] text-white/60 hover:text-white/80 transition-all duration-150 border border-white/6 hover:border-white/12 hover:bg-white/[0.04]"
            style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
