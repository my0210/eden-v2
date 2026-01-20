'use client';

import { format, addDays, isToday } from 'date-fns';
import Link from 'next/link';
import { DayOfWeek, DAY_LABELS } from '@/lib/types';

interface DayCompletion {
  total: number;
  completed: number;
  percentage: number;
}

interface WeekStripProps {
  weekStart: Date;
  selectedDay: DayOfWeek;
  completionStatus: Record<DayOfWeek, DayCompletion>;
}

/**
 * Progress circle component
 * ○ No tasks completed (empty)
 * ◐ Partially complete (half-filled)
 * ● All complete (full)
 * ◌ Rest day / no tasks (dotted)
 */
function ProgressCircle({ 
  completion, 
  isSelected, 
  isToday: dayIsToday 
}: { 
  completion: DayCompletion; 
  isSelected: boolean;
  isToday: boolean;
}) {
  const size = 18;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // No tasks = rest day (dotted circle)
  if (completion.total === 0) {
    return (
      <svg width={size} height={size} className="opacity-30">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray="2 2"
          className="text-foreground/40"
        />
      </svg>
    );
  }

  const progress = completion.percentage / 100;
  const strokeDashoffset = circumference * (1 - progress);
  
  // Determine colors
  const isComplete = completion.percentage === 100;
  const hasProgress = completion.completed > 0;
  
  const bgColor = 'rgba(255,255,255,0.1)';
  const progressColor = isComplete 
    ? '#4ade80' // green-400
    : dayIsToday 
      ? '#4ade80' 
      : isSelected 
        ? 'rgba(255,255,255,0.6)' 
        : 'rgba(255,255,255,0.4)';

  return (
    <svg 
      width={size} 
      height={size} 
      className="transform -rotate-90"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      {hasProgress && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      )}
      {/* Complete checkmark */}
      {isComplete && (
        <g className="transform rotate-90" style={{ transformOrigin: 'center' }}>
          <path
            d="M6 9l2 2 4-4"
            fill="none"
            stroke={progressColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

export function WeekStrip({ weekStart, selectedDay, completionStatus }: WeekStripProps) {
  const correctedDays = [
    { dayOfWeek: 1 as DayOfWeek, date: addDays(weekStart, 0) },
    { dayOfWeek: 2 as DayOfWeek, date: addDays(weekStart, 1) },
    { dayOfWeek: 3 as DayOfWeek, date: addDays(weekStart, 2) },
    { dayOfWeek: 4 as DayOfWeek, date: addDays(weekStart, 3) },
    { dayOfWeek: 5 as DayOfWeek, date: addDays(weekStart, 4) },
    { dayOfWeek: 6 as DayOfWeek, date: addDays(weekStart, 5) },
    { dayOfWeek: 0 as DayOfWeek, date: addDays(weekStart, 6) },
  ];

  return (
    <div className="flex justify-between gap-1">
      {correctedDays.map(({ dayOfWeek, date }) => {
        const isSelected = dayOfWeek === selectedDay;
        const dayIsToday = isToday(date);
        const completion = completionStatus[dayOfWeek];
        
        return (
          <Link
            key={dayOfWeek}
            href={`/week?day=${dayOfWeek}`}
            className={`
              flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl
              transition-all duration-300
              ${isSelected 
                ? 'bg-white/10 border border-white/20' 
                : 'hover:bg-white/5'
              }
            `}
          >
            {/* Day label */}
            <span className={`
              text-[10px] uppercase tracking-wider font-medium
              ${isSelected ? 'text-foreground/80' : 'text-foreground/40'}
            `}>
              {DAY_LABELS[dayOfWeek]}
            </span>

            {/* Date number */}
            <span className={`
              text-base font-light tabular-nums
              ${dayIsToday 
                ? 'text-green-400' 
                : isSelected 
                  ? 'text-foreground' 
                  : 'text-foreground/50'
              }
            `}>
              {format(date, 'd')}
            </span>

            {/* Progress circle */}
            <ProgressCircle 
              completion={completion} 
              isSelected={isSelected}
              isToday={dayIsToday}
            />
          </Link>
        );
      })}
    </div>
  );
}
