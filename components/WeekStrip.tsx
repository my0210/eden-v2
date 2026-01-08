'use client';

import { format, addDays, isToday, isBefore } from 'date-fns';
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

export function WeekStrip({ weekStart, selectedDay, completionStatus }: WeekStripProps) {
  // Generate days starting from Monday (1) to Sunday (0)
  const days: { dayOfWeek: DayOfWeek; date: Date }[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    // Map: Mon=0 -> 1, Tue=1 -> 2, ..., Sat=5 -> 6, Sun=6 -> 0
    const dayOfWeek = (i + 1) % 7 as DayOfWeek;
    days.push({ dayOfWeek: dayOfWeek === 0 ? 0 : dayOfWeek, date });
  }

  // Fix: Mon should be 1, not 0
  const correctedDays = [
    { dayOfWeek: 1 as DayOfWeek, date: addDays(weekStart, 0) }, // Mon
    { dayOfWeek: 2 as DayOfWeek, date: addDays(weekStart, 1) }, // Tue
    { dayOfWeek: 3 as DayOfWeek, date: addDays(weekStart, 2) }, // Wed
    { dayOfWeek: 4 as DayOfWeek, date: addDays(weekStart, 3) }, // Thu
    { dayOfWeek: 5 as DayOfWeek, date: addDays(weekStart, 4) }, // Fri
    { dayOfWeek: 6 as DayOfWeek, date: addDays(weekStart, 5) }, // Sat
    { dayOfWeek: 0 as DayOfWeek, date: addDays(weekStart, 6) }, // Sun
  ];

  return (
    <div className="flex justify-between gap-1">
      {correctedDays.map(({ dayOfWeek, date }) => {
        const isSelected = dayOfWeek === selectedDay;
        const dayIsToday = isToday(date);
        const isPast = isBefore(date, new Date()) && !dayIsToday;
        const completion = completionStatus[dayOfWeek];
        
        return (
          <Link
            key={dayOfWeek}
            href={`/week?day=${dayOfWeek}`}
            className={`
              flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg
              transition-all duration-200
              ${isSelected 
                ? 'bg-background-tertiary border border-foreground-subtle' 
                : 'hover:bg-background-secondary'
              }
            `}
          >
            {/* Day label */}
            <span className={`
              text-xs font-medium
              ${isSelected ? 'text-foreground' : 'text-foreground-muted'}
            `}>
              {DAY_LABELS[dayOfWeek]}
            </span>

            {/* Date number */}
            <span className={`
              text-sm font-semibold
              ${dayIsToday ? 'text-green-400' : isSelected ? 'text-foreground' : 'text-foreground-subtle'}
            `}>
              {format(date, 'd')}
            </span>

            {/* Completion bar */}
            <div className="w-full h-1 bg-background-tertiary rounded-full overflow-hidden">
              <div 
                className={`
                  h-full rounded-full transition-all duration-300
                  ${completion.percentage === 100 
                    ? 'bg-green-500' 
                    : isPast && completion.percentage < 100
                      ? 'bg-yellow-500'
                      : 'bg-green-500/70'
                  }
                `}
                style={{ width: `${completion.percentage}%` }}
              />
            </div>

            {/* Status indicator */}
            <span className="text-[10px] text-foreground-subtle">
              {completion.total === 0 
                ? '–'
                : completion.percentage === 100 
                  ? '✓'
                  : dayIsToday 
                    ? '★'
                    : isPast
                      ? `${completion.completed}/${completion.total}`
                      : '○'
              }
            </span>
          </Link>
        );
      })}
    </div>
  );
}

