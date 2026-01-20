'use client';

import { useState } from 'react';
import { Protocol, ProtocolWeek, Domain, DOMAIN_COLORS, DOMAIN_LABELS } from '@/lib/types';

interface ProtocolViewProps {
  protocol: Protocol;
  currentWeekNumber: number;
  weeklyProgress: Record<number, { total: number; completed: number }>;
}

export function ProtocolView({ protocol, currentWeekNumber, weeklyProgress }: ProtocolViewProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const selectedWeekData = selectedWeek !== null 
    ? protocol.weeks.find(w => w.weekNumber === selectedWeek) 
    : null;

  return (
    <div className="space-y-6">
      {/* Goal Summary */}
      <div className="px-6">
        <div 
          className="rounded-xl p-4"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <p className="text-xs text-foreground/40 uppercase tracking-wider mb-2">Your 12-week goal</p>
          <p className="text-sm text-foreground/70 leading-relaxed">{protocol.goalSummary}</p>
        </div>
      </div>

      {/* 12-Week Grid */}
      <div className="px-6">
        <div className="grid grid-cols-4 gap-2">
          {protocol.weeks.map((week) => {
            const progress = weeklyProgress[week.weekNumber] || { total: 0, completed: 0 };
            const isCurrent = week.weekNumber === currentWeekNumber;
            const isPast = week.weekNumber < currentWeekNumber;
            const isFuture = week.weekNumber > currentWeekNumber;
            const isSelected = selectedWeek === week.weekNumber;
            const percentage = progress.total > 0 
              ? Math.round((progress.completed / progress.total) * 100) 
              : 0;

            return (
              <button
                key={week.weekNumber}
                onClick={() => setSelectedWeek(isSelected ? null : week.weekNumber)}
                className={`
                  relative p-3 rounded-xl transition-all duration-300
                  ${isSelected 
                    ? 'bg-white/15 ring-1 ring-white/30 scale-105' 
                    : isCurrent 
                      ? 'bg-green-500/10 ring-1 ring-green-500/30'
                      : 'bg-white/5 hover:bg-white/8'
                  }
                `}
              >
                {/* Week number */}
                <div className={`
                  text-lg font-light tabular-nums mb-1
                  ${isCurrent ? 'text-green-400' : isPast ? 'text-foreground/60' : 'text-foreground/40'}
                `}>
                  {week.weekNumber}
                </div>

                {/* Progress indicator */}
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  {isPast || isCurrent ? (
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: percentage === 100 ? '#4ade80' : 'rgba(255,255,255,0.4)',
                      }}
                    />
                  ) : (
                    <div className="h-full w-0" />
                  )}
                </div>

                {/* Current week indicator */}
                {isCurrent && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Week Detail */}
      {selectedWeekData && (
        <div className="px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div 
            className="rounded-xl p-4 space-y-4"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.08)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            {/* Week header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-foreground/80">
                  Week {selectedWeekData.weekNumber}
                </h3>
                <p className="text-sm text-foreground/50">{selectedWeekData.focus}</p>
              </div>
              <button
                onClick={() => setSelectedWeek(null)}
                className="p-1 text-foreground/30 hover:text-foreground/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Domain focuses */}
            <div className="space-y-2">
              {Object.entries(selectedWeekData.domains).map(([domain, focus]) => (
                <div 
                  key={domain}
                  className="flex items-start gap-2 text-sm"
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: DOMAIN_COLORS[domain as Domain] }}
                  />
                  <div>
                    <span className="text-foreground/50">{DOMAIN_LABELS[domain as Domain]}:</span>{' '}
                    <span className="text-foreground/70">{focus}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Future week notice */}
            {selectedWeekData.weekNumber > currentWeekNumber && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-foreground/40 italic">
                  Daily tasks will be generated when this week begins.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-center gap-6 text-xs text-foreground/40">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>
    </div>
  );
}
