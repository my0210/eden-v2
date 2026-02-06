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
        {/* Center: checkmark when met, percentage when partial */}
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

// Gradual banner background based on coverage (0-5)
function getBannerStyle(coverage: number) {
  if (coverage === 5) {
    return {
      background: 'linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(16,185,129,0.08) 100%)',
      border: '1px solid rgba(34,197,94,0.25)',
    };
  }
  if (coverage >= 4) {
    return {
      background: 'linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(16,185,129,0.06) 100%)',
      border: '1px solid rgba(34,197,94,0.18)',
    };
  }
  if (coverage >= 3) {
    return {
      background: 'rgba(34,197,94,0.04)',
      border: '1px solid rgba(34,197,94,0.10)',
    };
  }
  if (coverage >= 1) {
    return {
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
    };
  }
  return {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
  };
}

export function StreakHero({ logs, streak }: StreakHeroProps) {
  const primeCoverage = getPrimeCoverage(logs);
  const bannerStyle = getBannerStyle(primeCoverage);

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
      className="mb-6 p-5 rounded-2xl transition-all duration-[1500ms] ease-out"
      style={bannerStyle}
    >
      {/* Streak count - quiet, only when > 0 */}
      {streak > 0 && (
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/70" />
          <span className="text-sm text-foreground/40 tabular-nums">
            {streak} {streak === 1 ? 'week' : 'weeks'}
          </span>
        </div>
      )}

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

      {/* Status text - same tone regardless of coverage */}
      <p className="text-center text-sm text-foreground/30">
        {primeCoverage} of 5 this week
      </p>
    </div>
  );
}
