'use client';

import { useState, useEffect } from 'react';
import { startOfWeek, format, endOfWeek } from 'date-fns';
import { CoreFiveCard } from './CoreFiveCard';
import { QuickLogModal } from './QuickLogModal';
import { WeekRecord } from './WeekRecord';
import { 
  PILLARS, 
  PILLAR_CONFIGS, 
  Pillar, 
  CoreFiveLog,
  getPillarProgress,
  getPrimeCoverage,
  getWeekStart,
} from '@/lib/v3/coreFive';

interface CoreFiveViewProps {
  userId: string;
}

export function CoreFiveView({ userId }: CoreFiveViewProps) {
  const [logs, setLogs] = useState<CoreFiveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [showRecord, setShowRecord] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = getWeekStart(today);

  // Fetch logs for current week
  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/v3/log?week_start=${weekStartStr}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [weekStartStr]);

  const handleLogSaved = (newLog: CoreFiveLog) => {
    setLogs(prev => [...prev, newLog]);
    setSelectedPillar(null);
  };

  const primeCoverage = getPrimeCoverage(logs);

  if (loading) {
    return (
      <div className="px-6 py-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      {/* Week Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-medium text-foreground/80">
            This Week
          </h1>
          <button 
            onClick={() => setShowRecord(true)}
            className="text-sm text-foreground/50 hover:text-foreground/70 transition-colors flex items-center gap-1"
          >
            View record
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-foreground/40">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Prime Coverage Banner */}
      <div 
        className="mb-6 p-4 rounded-2xl"
        style={{
          background: primeCoverage >= 4 
            ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.1) 100%)'
            : 'rgba(255,255,255,0.03)',
          border: primeCoverage >= 4 
            ? '1px solid rgba(34,197,94,0.3)'
            : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground/50 mb-1">Prime Coverage</p>
            <div className="flex items-baseline gap-1">
              <span 
                className="text-3xl font-semibold tabular-nums"
                style={{ color: primeCoverage >= 4 ? '#22c55e' : undefined }}
              >
                {primeCoverage}
              </span>
              <span className="text-lg text-foreground/40">/ 5</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {PILLARS.map(pillar => {
              const progress = getPillarProgress(logs, pillar);
              const target = PILLAR_CONFIGS[pillar].weeklyTarget;
              const isMet = progress >= target;
              return (
                <div
                  key={pillar}
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isMet 
                      ? PILLAR_CONFIGS[pillar].color 
                      : `${PILLAR_CONFIGS[pillar].color}30`,
                  }}
                />
              );
            })}
          </div>
        </div>
        {primeCoverage === 5 && (
          <p className="text-sm text-green-400/80 mt-2">
            All pillars hit this week — you&apos;re in your prime.
          </p>
        )}
      </div>

      {/* Core Five Cards */}
      <div className="grid gap-4">
        {PILLARS.map(pillar => (
          <CoreFiveCard
            key={pillar}
            config={PILLAR_CONFIGS[pillar]}
            current={getPillarProgress(logs, pillar)}
            onLogClick={() => setSelectedPillar(pillar)}
          />
        ))}
      </div>

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

      {/* Week Record Modal */}
      {showRecord && (
        <WeekRecord
          userId={userId}
          onClose={() => setShowRecord(false)}
        />
      )}
    </div>
  );
}
