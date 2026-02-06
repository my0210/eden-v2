'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { startOfWeek, format, endOfWeek, addWeeks } from 'date-fns';
import { CoreFiveCard } from './CoreFiveCard';
import { QuickLogModal } from './QuickLogModal';
import { TrendView } from './TrendView';
import { PillarDetailDrawer } from './PillarDetailDrawer';
import { V3Onboarding } from './V3Onboarding';
import { StreakHero } from './StreakHero';
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

export function CoreFiveView({ userId }: CoreFiveViewProps) {
  const [logs, setLogs] = useState<CoreFiveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [detailPillar, setDetailPillar] = useState<Pillar | null>(null);
  const [showRecord, setShowRecord] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Streak data
  const [streak, setStreak] = useState(0);
  
  // Subtle card glow on completion
  const [justCompletedPillar, setJustCompletedPillar] = useState<Pillar | null>(null);
  const prevCoverageRef = useRef<number>(0);

  // Skip transitions when switching weeks (snap instantly)
  const [skipTransition, setSkipTransition] = useState(false);

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
    setSkipTransition(true);
    setLoading(true);
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/v3/log?week_start=${weekStartStr}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedLogs = data.logs || [];
          setLogs(fetchedLogs);
          prevCoverageRef.current = getPrimeCoverage(fetchedLogs);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
        // Re-enable transitions after a frame so new state renders without animation
        requestAnimationFrame(() => setSkipTransition(false));
      }
    }
    fetchLogs();
  }, [weekStartStr]);

  // Fetch streak data on mount
  useEffect(() => {
    async function fetchStreak() {
      try {
        const res = await fetch('/api/v3/log/history?weeks=12');
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
        }
      } catch (error) {
        console.error('Failed to fetch streak:', error);
      }
    }
    fetchStreak();
  }, []);

  const primeCoverage = getPrimeCoverage(logs);
  const ambientStyle = getAmbientStyle(primeCoverage);

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
    setSelectedPillar(null);
  }, [logs]);

  const handleLogSaved = (newLog: CoreFiveLog) => {
    handleLogComplete(newLog);
  };

  // Quick-log handler: POST directly without modal
  const handleQuickLog = useCallback(async (pillar: Pillar, value: number) => {
    try {
      const res = await fetch('/api/v3/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      console.error('Quick log failed:', error);
    }
  }, [weekStartStr, handleLogComplete]);

  const handleLogDeleted = (logId: string) => {
    const updatedLogs = logs.filter(l => l.id !== logId);
    setLogs(updatedLogs);
    prevCoverageRef.current = getPrimeCoverage(updatedLogs);
  };

  const handleLogUpdated = (updatedLog: CoreFiveLog) => {
    const updatedLogs = logs.map(l => l.id === updatedLog.id ? updatedLog : l);
    setLogs(updatedLogs);
    prevCoverageRef.current = getPrimeCoverage(updatedLogs);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('huuman_v3_onboarded', 'true');
    setShowOnboarding(false);
  };

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
    <>
      {/* Dynamic ambient orb - responds to coverage */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div 
          className={`relative w-[800px] h-[800px] ${skipTransition ? '' : 'transition-all duration-[2000ms] ease-out'}`}
          style={{ transform: `scale(${ambientStyle.scale})` }}
        >
          <div 
            className={`absolute inset-0 rounded-full blur-[150px] ${skipTransition ? '' : 'transition-opacity duration-[2000ms] ease-out'}`}
            style={{
              opacity: ambientStyle.opacity,
              background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)',
            }}
          />
        </div>
      </div>

      <div className="px-6 py-4 relative z-10">
        {/* Week Header with Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
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

        {/* Streak Hero Banner */}
        <StreakHero
          logs={logs}
          streak={streak}
          skipTransition={skipTransition}
        />

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
              readOnly={!isCurrentWeek}
              justCompleted={justCompletedPillar === pillar}
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

        {/* Trend View */}
        {showRecord && (
          <TrendView
            userId={userId}
            onClose={() => setShowRecord(false)}
          />
        )}
      </div>
    </>
  );
}
