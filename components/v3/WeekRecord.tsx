'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, subWeeks, parseISO } from 'date-fns';
import { 
  PILLARS, 
  PILLAR_CONFIGS, 
  Pillar, 
  CoreFiveLog,
  getPillarProgress,
  getPrimeCoverage,
  getWeekStart,
} from '@/lib/v3/coreFive';

interface WeekRecordProps {
  userId: string;
  onClose: () => void;
}

interface WeekSummary {
  weekStart: string;
  coverage: number;
  pillars: Record<Pillar, { current: number; met: boolean }>;
  hasData: boolean; // true if any logs exist for this week
}

export function WeekRecord({ userId, onClose }: WeekRecordProps) {
  const [weeks, setWeeks] = useState<WeekSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch logs for the last 12 weeks
  useEffect(() => {
    async function fetchWeeks() {
      const today = new Date();
      const weekPromises: Promise<WeekSummary>[] = [];

      for (let i = 0; i < 12; i++) {
        const weekDate = subWeeks(today, i);
        const weekStartStr = getWeekStart(weekDate);
        
        weekPromises.push(
          fetch(`/api/v3/log?week_start=${weekStartStr}`)
            .then(res => res.json())
            .then(data => {
              const logs: CoreFiveLog[] = data.logs || [];
              const pillars = {} as Record<Pillar, { current: number; met: boolean }>;
              
              PILLARS.forEach(pillar => {
                const current = getPillarProgress(logs, pillar);
                const target = PILLAR_CONFIGS[pillar].weeklyTarget;
                pillars[pillar] = {
                  current,
                  met: current >= target,
                };
              });

              return {
                weekStart: weekStartStr,
                coverage: getPrimeCoverage(logs),
                pillars,
                hasData: logs.length > 0,
              };
            })
        );
      }

      const results = await Promise.all(weekPromises);
      // Filter: always show current week, only show past weeks with data
      const filteredResults = results.filter((week, index) => 
        index === 0 || week.hasData
      );
      setWeeks(filteredResults);
      setLoading(false);
    }

    fetchWeeks();
  }, [userId]);

  // Calculate streak (consecutive weeks with 4+ coverage)
  const calculateStreak = () => {
    let streak = 0;
    for (const week of weeks) {
      if (week.coverage >= 4) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  // Calculate total weeks with 5/5
  const perfectWeeks = weeks.filter(w => w.coverage === 5).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[80vh] bg-background sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-foreground/5 px-6 py-4 flex items-center justify-between">
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
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 64px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats summary */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                  <p className="text-sm text-foreground/50 mb-1">Current Streak</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-green-400">{streak}</span>
                    <span className="text-sm text-foreground/40">weeks</span>
                  </div>
                  <p className="text-xs text-foreground/30 mt-1">4+ pillars hit</p>
                </div>
                <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                  <p className="text-sm text-foreground/50 mb-1">Perfect Weeks</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold">{perfectWeeks}</span>
                    {weeks.length > 1 && (
                      <span className="text-sm text-foreground/40">/ {weeks.length}</span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/30 mt-1">All 5 pillars</p>
                </div>
              </div>

              {/* Week-by-week breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground/60 mb-2">
                  {weeks.length === 1 ? 'This Week' : `Last ${weeks.length} Weeks`}
                </h3>
                {weeks.map((week, index) => {
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
                        <div className="flex items-center gap-1.5">
                          <span 
                            className={`text-sm font-medium ${
                              week.coverage >= 4 ? 'text-green-400' : 'text-foreground/50'
                            }`}
                          >
                            {week.coverage}/5
                          </span>
                        </div>
                      </div>
                      
                      {/* Pillar dots */}
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
