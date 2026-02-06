'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, subWeeks } from 'date-fns';
import { 
  PILLARS, 
  PILLAR_CONFIGS, 
  Pillar, 
  CoreFiveLog,
  getPillarProgress,
  getPrimeCoverage,
  getWeekStart,
} from '@/lib/v3/coreFive';

interface TrendViewProps {
  userId: string;
  onClose: () => void;
}

interface WeekSummary {
  weekStart: string;
  coverage: number;
  pillars: Record<Pillar, { current: number; target: number; met: boolean; pct: number }>;
  hasData: boolean;
}

export function TrendView({ userId, onClose }: TrendViewProps) {
  const [allLogs, setAllLogs] = useState<CoreFiveLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all logs in one call
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/v3/log/history?weeks=12');
        if (res.ok) {
          const data = await res.json();
          setAllLogs(data.logs || []);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [userId]);

  // Build week summaries from logs
  const weeks = useMemo(() => {
    const today = new Date();
    const result: WeekSummary[] = [];

    for (let i = 0; i < 12; i++) {
      const weekDate = subWeeks(today, i);
      const weekStartStr = getWeekStart(weekDate);
      const weekLogs = allLogs.filter(l => l.weekStart === weekStartStr);
      
      const pillars = {} as Record<Pillar, { current: number; target: number; met: boolean; pct: number }>;
      PILLARS.forEach(pillar => {
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

  // Only show weeks with data (plus current week always)
  const visibleWeeks = weeks.filter((w, i) => i === 0 || w.hasData);

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
  const fullWeeks = weeks.filter(w => w.coverage === 5).length;

  // Heatmap: only weeks with data (+ current week), oldest → newest left to right
  const heatmapWeeks = [...visibleWeeks].reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[85vh] bg-background sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-foreground/5 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-foreground/90">Your Record</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 64px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10">
                  <p className="text-xs text-foreground/40 mb-1">Streak</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-semibold text-green-400 tabular-nums">{streak}</span>
                    <span className="text-xs text-foreground/30">wk</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10">
                  <p className="text-xs text-foreground/40 mb-1">Best</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-semibold tabular-nums">{bestStreak}</span>
                    <span className="text-xs text-foreground/30">wk</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10">
                  <p className="text-xs text-foreground/40 mb-1">Full</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-semibold tabular-nums">{fullWeeks}</span>
                    <span className="text-xs text-foreground/30">/ {visibleWeeks.length}</span>
                  </div>
                </div>
              </div>

              {/* Coverage Heatmap */}
              <div className="mb-8">
                <h3 className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-3">
                  Heatmap
                </h3>
                <div className="overflow-x-auto -mx-2 px-2">
                  <div className="min-w-[320px]">
                    {/* Week labels */}
                    <div className="flex gap-1 mb-1.5 pl-16">
                      {heatmapWeeks.map((week, i) => (
                        <div 
                          key={week.weekStart} 
                          className="flex-1 text-center"
                        >
                          <span className="text-[9px] text-foreground/25 tabular-nums">
                            {i === 0 ? format(parseISO(week.weekStart), 'M/d') : 
                             i === heatmapWeeks.length - 1 ? 'Now' :
                             i % 3 === 0 ? format(parseISO(week.weekStart), 'M/d') : ''}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pillar rows */}
                    {PILLARS.map(pillar => {
                      const config = PILLAR_CONFIGS[pillar];
                      return (
                        <div key={pillar} className="flex items-center gap-1 mb-1">
                          <span className="text-[10px] text-foreground/40 w-14 text-right pr-2 flex-shrink-0 truncate">
                            {config.name}
                          </span>
                          {heatmapWeeks.map(week => {
                            const { met, pct } = week.pillars[pillar];
                            return (
                              <div
                                key={week.weekStart}
                                className="flex-1 aspect-square rounded-sm transition-all"
                                style={{
                                  backgroundColor: !week.hasData 
                                    ? 'rgba(255,255,255,0.03)' 
                                    : met 
                                      ? config.color 
                                      : pct > 0 
                                        ? `${config.color}${Math.max(Math.round(pct * 0.4), 10).toString(16).padStart(2, '0')}`
                                        : `${config.color}08`,
                                  minWidth: '16px',
                                  maxWidth: '28px',
                                }}
                                title={`${config.name}: ${week.pillars[pillar].current}/${config.weeklyTarget} ${config.unit} (${format(parseISO(week.weekStart), 'MMM d')})`}
                              />
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Coverage row */}
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-foreground/5">
                      <span className="text-[10px] text-foreground/40 w-14 text-right pr-2 flex-shrink-0">
                        Score
                      </span>
                      {heatmapWeeks.map(week => (
                        <div
                          key={week.weekStart}
                          className="flex-1 text-center"
                          style={{ minWidth: '16px', maxWidth: '28px' }}
                        >
                          <span 
                            className="text-[10px] font-medium tabular-nums"
                            style={{ 
                              color: !week.hasData 
                                ? 'rgba(255,255,255,0.1)' 
                                : week.coverage >= 4 
                                  ? '#22c55e' 
                                  : 'rgba(255,255,255,0.3)'
                            }}
                          >
                            {week.hasData ? week.coverage : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-Pillar Sparklines */}
              <div className="mb-8">
                <h3 className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-3">
                  Pillar Trends
                </h3>
                <div className="space-y-3">
                  {PILLARS.map(pillar => {
                    const config = PILLAR_CONFIGS[pillar];
                    // Get percentages for last 12 weeks (oldest to newest)
                    const pcts = heatmapWeeks.map(w => w.pillars[pillar].pct);
                    const weeksHit = heatmapWeeks.filter(w => w.pillars[pillar].met && w.hasData).length;
                    const totalWithData = heatmapWeeks.filter(w => w.hasData).length;

                    return (
                      <div key={pillar} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-24 flex-shrink-0">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-xs text-foreground/60 truncate">{config.name}</span>
                        </div>

                        {/* Mini bar chart */}
                        <div className="flex-1 flex items-end gap-px h-6">
                          {pcts.map((pct, i) => (
                            <div 
                              key={i} 
                              className="flex-1 rounded-t-sm transition-all"
                              style={{ 
                                height: `${Math.max(pct * 0.95, heatmapWeeks[i].hasData ? 5 : 0)}%`,
                                backgroundColor: !heatmapWeeks[i].hasData 
                                  ? 'transparent'
                                  : pct >= 100 
                                    ? config.color 
                                    : `${config.color}50`,
                                minHeight: heatmapWeeks[i].hasData ? '2px' : '0',
                              }}
                            />
                          ))}
                        </div>

                        {/* Hit count */}
                        <span className="text-xs text-foreground/30 w-10 text-right tabular-nums flex-shrink-0">
                          {weeksHit}/{totalWithData}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Week-by-week breakdown */}
              <div>
                <h3 className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-3">
                  {visibleWeeks.length === 1 ? 'This Week' : 'Week by Week'}
                </h3>
                <div className="space-y-2">
                  {visibleWeeks.map((week, index) => {
                    const weekDate = parseISO(week.weekStart);
                    const isCurrentWeek = index === 0;
                    
                    return (
                      <div 
                        key={week.weekStart}
                        className={`p-3 rounded-xl transition-all ${
                          isCurrentWeek 
                            ? 'bg-green-500/10 border border-green-500/20' 
                            : 'bg-foreground/3 border border-foreground/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground/70">
                              {format(weekDate, 'MMM d')}
                            </span>
                            {isCurrentWeek && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                This week
                              </span>
                            )}
                          </div>
                          <span 
                            className={`text-sm font-medium ${
                              week.coverage >= 4 ? 'text-green-400' : 'text-foreground/50'
                            }`}
                          >
                            {week.coverage}/5
                          </span>
                        </div>
                        
                        {/* Pillar bars with values */}
                        <div className="flex gap-1.5">
                          {PILLARS.map(pillar => {
                            const { met } = week.pillars[pillar];
                            const config = PILLAR_CONFIGS[pillar];
                            return (
                              <div
                                key={pillar}
                                className="flex-1 h-1.5 rounded-full transition-all"
                                style={{
                                  backgroundColor: met 
                                    ? config.color 
                                    : `${config.color}20`,
                                }}
                                title={`${config.name}: ${week.pillars[pillar].current}/${config.weeklyTarget} ${config.unit}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-foreground/5">
                <p className="text-xs text-foreground/40 mb-2">Pillars</p>
                <div className="flex flex-wrap gap-3">
                  {PILLARS.map(pillar => {
                    const config = PILLAR_CONFIGS[pillar];
                    return (
                      <div key={pillar} className="flex items-center gap-1.5">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-xs text-foreground/50">{config.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
