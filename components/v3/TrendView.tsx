"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parseISO, subWeeks } from "date-fns";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { 
  PILLARS, 
  PILLAR_CONFIGS, 
  Pillar, 
  CoreFiveLog,
  getPillarProgress,
  getPrimeCoverage,
  getWeekStart,
} from "@/lib/v3/coreFive";
import { GlassCard } from "@/components/ui/GlassCard";

interface TrendViewProps {
  userId: string;
  onBack: () => void;
}

interface WeekSummary {
  weekStart: string;
  coverage: number;
  pillars: Record<Pillar, { current: number; target: number; met: boolean; pct: number }>;
  hasData: boolean;
}

export function TrendView({ userId, onBack }: TrendViewProps) {
  const [allLogs, setAllLogs] = useState<CoreFiveLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all logs in one call
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/v3/log/history?weeks=12");
        if (res.ok) {
          const data = await res.json();
          setAllLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [userId]);

  // Build week summaries for all 12 weeks
  const weeks = useMemo(() => {
    const today = new Date();
    const result: WeekSummary[] = [];

    for (let i = 0; i < 12; i++) {
      const weekDate = subWeeks(today, i);
      const weekStartStr = getWeekStart(weekDate);
      const weekLogs = allLogs.filter((l) => l.weekStart === weekStartStr);
      
      const pillars = {} as Record<Pillar, { current: number; target: number; met: boolean; pct: number }>;
      PILLARS.forEach((pillar) => {
        const current = getPillarProgress(weekLogs, pillar);
        const target = PILLAR_CONFIGS[pillar].weeklyTarget;
        pillars[pillar] = {
          current,
          target,
          met: current >= target,
          pct: Math.min(Math.round((current / target) * 100), 100),
        };
      });

      result.push({
        weekStart: weekStartStr,
        coverage: getPrimeCoverage(weekLogs),
        pillars,
        hasData: weekLogs.length > 0,
      });
    }

    return result;
  }, [allLogs]);

  // Visible weeks for the week-by-week list (only with data + current)
  const visibleWeeks = weeks.filter((w, i) => i === 0 || w.hasData);

  // Heatmap: always 12 columns, oldest → newest (left to right)
  const heatmapWeeks = [...weeks].reverse();

  // Stats
  const calculateStreak = () => {
    let streak = 0;
    for (const week of weeks) {
      if (week.coverage >= 4) streak++;
      else break;
    }
    return streak;
  };

  const calculateBestStreak = () => {
    let best = 0;
    let current = 0;
    for (const week of [...weeks].reverse()) {
      if (week.coverage >= 4) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return best;
  };

  const streak = calculateStreak();
  const bestStreak = calculateBestStreak();

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white/90">History</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 max-w-lg mx-auto">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <GlassCard variant="subtle" className="p-4 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Current Streak</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold text-green-400 tabular-nums">{streak}</span>
                  <span className="text-sm text-white/30">wks</span>
                </div>
              </GlassCard>
              <GlassCard variant="subtle" className="p-4 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Best Streak</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold text-white/90 tabular-nums">{bestStreak}</span>
                  <span className="text-sm text-white/30">wks</span>
                </div>
              </GlassCard>
            </div>

            {/* Heatmap */}
            <GlassCard variant="panel" className="p-5">
              <h3 className="text-sm font-medium text-white/60 mb-4">12-Week Overview</h3>
              <div className="overflow-x-auto -mx-2 px-2 pb-2">
                <div className="min-w-[300px]">
                  {/* Week labels */}
                  <div className="flex gap-1 mb-2 pl-14">
                    {heatmapWeeks.map((week, i) => (
                      <div key={week.weekStart} className="flex-1 text-center">
                        <span className="text-[9px] text-white/20 tabular-nums">
                          {i === heatmapWeeks.length - 1 ? "Now" : 
                           i % 4 === 0 ? format(parseISO(week.weekStart), "M/d") : ""}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pillar rows */}
                  {PILLARS.map((pillar) => {
                    const config = PILLAR_CONFIGS[pillar];
                    return (
                      <div key={pillar} className="flex items-center gap-1 mb-1.5">
                        <span className="text-[10px] text-white/40 w-12 text-right pr-2 flex-shrink-0 truncate">
                          {config.name}
                        </span>
                        {heatmapWeeks.map((week) => {
                          const { met, pct } = week.pillars[pillar];
                          return (
                            <div
                              key={week.weekStart}
                              className="flex-1 aspect-square rounded-sm transition-all"
                              style={{
                                backgroundColor: !week.hasData 
                                  ? "rgba(255,255,255,0.03)" 
                                  : met 
                                    ? config.color 
                                    : pct > 0 
                                      ? `${config.color}${Math.max(Math.round(pct * 0.4), 10).toString(16).padStart(2, "0")}`
                                      : `${config.color}08`,
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            {/* Week List */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider px-1">Weekly Breakdown</h3>
              {visibleWeeks.map((week, index) => {
                const weekDate = parseISO(week.weekStart);
                const isCurrentWeek = index === 0;
                
                return (
                  <GlassCard 
                    key={week.weekStart}
                    variant={isCurrentWeek ? "highlight" : "subtle"}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-medium text-white/80">
                          {format(weekDate, "MMM d")} - {format(parseISO(week.weekStart), "MMM d")}
                        </span>
                        {isCurrentWeek && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-bold ${week.coverage >= 4 ? "text-green-400" : "text-white/40"}`}>
                        {week.coverage}/5
                      </span>
                    </div>
                    
                    {/* Pillar bars */}
                    <div className="flex gap-2">
                      {PILLARS.map((pillar) => {
                        const { met } = week.pillars[pillar];
                        const config = PILLAR_CONFIGS[pillar];
                        return (
                          <div
                            key={pillar}
                            className="flex-1 h-1.5 rounded-full transition-all"
                            style={{
                              backgroundColor: met ? config.color : `${config.color}15`,
                              boxShadow: met ? `0 0 8px ${config.color}40` : "none"
                            }}
                          />
                        );
                      })}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
