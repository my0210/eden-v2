'use client';

import { useState } from 'react';
import { Pillar, PillarConfig } from '@/lib/v3/coreFive';

interface CoreFiveCardProps {
  config: PillarConfig;
  current: number;
  onLogClick: () => void;
  onQuickLog?: (value: number) => Promise<void>;
  onCardClick?: () => void;
  readOnly?: boolean;
  justCompleted?: boolean;
}

// Icon props type
interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

// Icon components
function HeartIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function DumbbellIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h.008v.008H3.75V6.75zm0 3h.008v.008H3.75V9.75zm0 4.5h.008v.008H3.75v-.008zm0 3h.008v.008H3.75v-.008zm16.5-10.5h.008v.008h-.008V6.75zm0 3h.008v.008h-.008V9.75zm0 4.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zM6 6.75v10.5m12-10.5v10.5M6 12h12" />
    </svg>
  );
}

function MoonIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function LeafIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-.327 1.074l-1.473 1.104a.75.75 0 00-.2.897l.465.93c.227.454.637.768 1.103.844a.75.75 0 00.62-.22l1.178-1.178a2.25 2.25 0 011.128-.605l.424-.085a.75.75 0 00.492-1.077l-.368-.614a1.5 1.5 0 01.247-1.862l.578-.578a2.625 2.625 0 011.324-.706l.859-.172a.75.75 0 00.49-1.078l-.427-.64a1.5 1.5 0 01.173-1.853l.398-.398a1.5 1.5 0 00.396-1.423l-.204-.818a.75.75 0 00-.525-.525l-.818-.204a1.5 1.5 0 01-1.423.396l-.398.398a1.5 1.5 0 01-1.853.173l-.64-.427a.75.75 0 00-1.078.49l-.172.859a2.625 2.625 0 01-.706 1.324l-.578.578a1.5 1.5 0 01-1.862.247l-.614-.368a.75.75 0 00-1.077.492l-.085.424a2.25 2.25 0 01-.605 1.128l-1.178 1.178a.75.75 0 00-.22.62c.076.466.39.876.844 1.103l.93.465a.75.75 0 00.897-.2l1.104-1.473a.956.956 0 011.074-.327l1.059.423L13.125 9l.048-.143a2.25 2.25 0 01.886-1.161l.89-1.068c.214-.257.53-.405.864-.405h.568" />
    </svg>
  );
}

function BrainIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

export const iconComponents: Record<string, React.ComponentType<IconProps>> = {
  heart: HeartIcon,
  dumbbell: DumbbellIcon,
  moon: MoonIcon,
  leaf: LeafIcon,
  brain: BrainIcon,
};

// Pillars that support quick-tap (no modal needed)
const QUICK_TAP_PILLARS: Pillar[] = ['clean_eating', 'strength'];

export function CoreFiveCard({ config, current, onLogClick, onQuickLog, onCardClick, readOnly, justCompleted }: CoreFiveCardProps) {
  const { id: pillarId, name, weeklyTarget, unit, description, color, icon } = config;
  const progress = Math.min((current / weeklyTarget) * 100, 100);
  const isMet = current >= weeklyTarget;
  const isQuickTap = QUICK_TAP_PILLARS.includes(pillarId) && onQuickLog;
  const [quickLogging, setQuickLogging] = useState(false);

  const IconComponent = iconComponents[icon] || HeartIcon;

  const handleQuickLog = async (value: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuickLog || quickLogging) return;
    setQuickLogging(true);
    try {
      await onQuickLog(value);
    } finally {
      setQuickLogging(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${onCardClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} ${justCompleted ? 'animate-glow-pulse' : ''}`}
      style={{
        backgroundColor: `${color}10`,
        borderColor: `${color}30`,
        borderWidth: '1px',
        borderStyle: 'solid',
        ['--glow-color' as string]: `${color}40`,
      }}
      onClick={onCardClick}
    >
      {/* Completed checkmark overlay */}
      {isMet && (
        <div 
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}30` }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      )}

      {/* Header with icon and name */}
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <IconComponent className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-base font-medium text-foreground/90">{name}</h3>
          <p className="text-xs text-foreground/50">{description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className={readOnly ? '' : 'mb-3'}>
        <div className="flex items-baseline justify-between mb-1.5">
          <span 
            className="text-2xl font-semibold tabular-nums"
            style={{ color: isMet ? color : undefined }}
          >
            {current}
          </span>
          <span className="text-sm text-foreground/40">
            / {weeklyTarget} {unit}
          </span>
        </div>
        
        {/* Progress bar */}
        <div 
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: `${color}15` }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${progress}%`,
              backgroundColor: color,
              opacity: isMet ? 1 : 0.7,
            }}
          />
        </div>
      </div>

      {/* Log buttons - hidden in readOnly mode */}
      {!readOnly && (
        <>
          {/* Quick-tap: Clean Eating */}
          {pillarId === 'clean_eating' && isQuickTap ? (
            <div className="flex gap-2">
              <button
                onClick={(e) => handleQuickLog(1, e)}
                disabled={quickLogging}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {quickLogging ? '...' : '✓ On-plan'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogClick();
                }}
                className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
              >
                More
              </button>
            </div>
          ) : pillarId === 'strength' && isQuickTap ? (
            /* Quick-tap: Strength */
            <div className="flex gap-2">
              <button
                onClick={(e) => handleQuickLog(1, e)}
                disabled={quickLogging}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {quickLogging ? '...' : '+1 Session'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogClick();
                }}
                className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
              >
                More
              </button>
            </div>
          ) : (
            /* Standard log button for Cardio, Sleep, Mindfulness */
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogClick();
              }}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-110 active:brightness-90"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              + Log {name}
            </button>
          )}
        </>
      )}
    </div>
  );
}
