'use client';

import { useMemo } from 'react';
import { 
  PILLARS, 
  PILLAR_CONFIGS, 
  Pillar,
  CoreFiveLog,
  getPillarProgress,
  getPrimeCoverage,
} from '@/lib/v3/coreFive';

interface StreakHeroProps {
  logs: CoreFiveLog[];
  streak: number;
  allFiveHit: boolean;
}

// SVG ring that fills proportionally
function PillarRing({ 
  pillar, 
  pct, 
  met 
}: { 
  pillar: Pillar; 
  pct: number; 
  met: boolean;
}) {
  const config = PILLAR_CONFIGS[pillar];
  const size = 40;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`${config.color}18`}
            strokeWidth={strokeWidth}
          />
        </svg>
        {/* Progress ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            opacity={met ? 1 : 0.6}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center: checkmark when met, or percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          {met ? (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path 
                d="M5 13l4 4L19 7" 
                stroke={config.color} 
                strokeWidth={2.5} 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="animate-check-draw"
              />
            </svg>
          ) : pct > 0 ? (
            <span 
              className="text-[10px] font-medium tabular-nums"
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
        {config.name.length > 5 ? config.name.slice(0, 4) : config.name}
      </span>
    </div>
  );
}

export function StreakHero({ logs, streak, allFiveHit }: StreakHeroProps) {
  const primeCoverage = getPrimeCoverage(logs);

  const pillarData = useMemo(() => {
    return PILLARS.map(pillar => {
      const current = getPillarProgress(logs, pillar);
      const target = PILLAR_CONFIGS[pillar].weeklyTarget;
      return {
        pillar,
        pct: target > 0 ? (current / target) * 100 : 0,
        met: current >= target,
      };
    });
  }, [logs]);

  return (
    <div 
      className="mb-6 p-5 rounded-2xl relative overflow-hidden transition-all duration-500"
      style={{
        background: allFiveHit
          ? 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(16,185,129,0.12) 50%, rgba(34,197,94,0.08) 100%)'
          : primeCoverage >= 4 
            ? 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.08) 100%)'
            : 'rgba(255,255,255,0.03)',
        border: allFiveHit 
          ? '1px solid rgba(34,197,94,0.4)'
          : primeCoverage >= 4 
            ? '1px solid rgba(34,197,94,0.25)'
            : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Shimmer overlay when all 5 hit */}
      {allFiveHit && (
        <div 
          className="absolute inset-0 animate-shimmer pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.06) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}

      {/* Streak count */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {streak > 0 ? (
          <>
            <span className="text-lg" role="img" aria-label="streak">🔥</span>
            <span className="text-2xl font-bold tabular-nums text-green-400">
              {streak}
            </span>
            <span className="text-sm text-foreground/40 font-medium">
              {streak === 1 ? 'week' : 'weeks'}
            </span>
          </>
        ) : (
          <span className="text-sm text-foreground/30">
            Start your streak
          </span>
        )}
      </div>

      {/* Pillar rings */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {pillarData.map(({ pillar, pct, met }) => (
          <PillarRing
            key={pillar}
            pillar={pillar}
            pct={pct}
            met={met}
          />
        ))}
      </div>

      {/* Status text */}
      <p className="text-center text-sm transition-colors duration-300" style={{
        color: allFiveHit ? '#22c55e' : 'rgba(255,255,255,0.4)',
      }}>
        {allFiveHit 
          ? "All 5 hit — you're in your prime."
          : `${primeCoverage} of 5 pillars hit`
        }
      </p>
    </div>
  );
}
