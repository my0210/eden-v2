'use client';

import { useState, useEffect, useMemo } from 'react';
import { startOfWeek, format, endOfWeek, addWeeks } from 'date-fns';
import { CoreFiveCard } from './CoreFiveCard';
import { QuickLogModal } from './QuickLogModal';
import { TrendView } from './TrendView';
import { PillarDetailDrawer } from './PillarDetailDrawer';
import { V3Onboarding } from './V3Onboarding';
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
  const [detailPillar, setDetailPillar] = useState<Pillar | null>(null);
  const [showRecord, setShowRecord] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, etc.
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboarded = localStorage.getItem('huuman_v3_onboarded');
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

  // Fetch logs for the selected week
  useEffect(() => {
    setLoading(true);
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

  const handleLogDeleted = (logId: string) => {
    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  const handleLogUpdated = (updatedLog: CoreFiveLog) => {
    setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('huuman_v3_onboarded', 'true');
    setShowOnboarding(false);
  };

  const primeCoverage = getPrimeCoverage(logs);

  // Onboarding gate
  if (showOnboarding) {
    return <V3Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (loading) {
    return (
      <div className="px-6 py-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      {/* Week Header with Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Back arrow */}
            <button
              onClick={() => setWeekOffset(prev => Math.max(prev - 1, -12))}
              disabled={weekOffset <= -12}
              className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <h1 className="text-lg font-medium text-foreground/80">
              {isCurrentWeek ? 'This Week' : format(weekStart, 'MMM d')}
            </h1>

            {/* Forward arrow */}
            <button
              onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
              disabled={isCurrentWeek}
              className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

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

      {/* Progress Banner */}
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
            <p className="text-sm text-foreground/50 mb-1">Progress</p>
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
            onCardClick={() => setDetailPillar(pillar)}
            readOnly={!isCurrentWeek}
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

      {/* Trend View (replaces old WeekRecord) */}
      {showRecord && (
        <TrendView
          userId={userId}
          onClose={() => setShowRecord(false)}
        />
      )}
    </div>
  );
}
