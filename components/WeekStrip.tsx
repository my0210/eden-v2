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
    <div className="flex justify-between gap-2">
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
              flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl
              transition-all duration-300
              ${isSelected 
                ? 'bg-white/10 border border-white/20' 
                : 'hover:bg-white/5'
              }
            `}
          >
            <span className={`
              text-xs uppercase tracking-wider
              ${isSelected ? 'text-foreground/80' : 'text-foreground/40'}
            `}>
              {DAY_LABELS[dayOfWeek]}
            </span>

            <span className={`
              text-lg font-light
              ${dayIsToday 
                ? 'text-green-400' 
                : isSelected 
                  ? 'text-foreground' 
                  : 'text-foreground/50'
              }
            `}>
              {format(date, 'd')}
            </span>

            {/* Minimal completion dot */}
            <div className={`
              w-1.5 h-1.5 rounded-full transition-colors duration-300
              ${completion.percentage === 100 
                ? 'bg-green-400' 
                : completion.total > 0 && completion.completed > 0
                  ? 'bg-white/30'
                  : 'bg-white/10'
              }
            `} />
          </Link>
        );
      })}
    </div>
  );
}
