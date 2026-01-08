'use client';

import { format } from 'date-fns';
import { PlanItem, DAY_FULL_LABELS, DayOfWeek } from '@/lib/types';
import { PlanItemCard } from './PlanItemCard';

interface DayViewProps {
  date: Date;
  items: PlanItem[];
  edenIntro?: string;
  isToday: boolean;
  isPast: boolean;
}

export function DayView({ date, items, edenIntro, isToday, isPast }: DayViewProps) {
  const dayOfWeek = date.getDay() as DayOfWeek;
  const dayName = DAY_FULL_LABELS[dayOfWeek];
  
  // Separate priority items (sortOrder 0 or first items) from others
  const priorityItems = items.filter(item => item.sortOrder === 0);
  const otherItems = items.filter(item => item.sortOrder !== 0);

  // If no items
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <DayHeader 
          dayName={dayName}
          date={date}
          isToday={isToday}
        />
        
        <div className="card text-center py-8">
          <p className="text-foreground-muted">
            {isPast 
              ? 'No items were scheduled for this day.'
              : 'No items scheduled yet.'
            }
          </p>
          {isToday && (
            <p className="text-foreground-subtle text-sm mt-2">
              Your plan will be generated based on your profile.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day Header */}
      <DayHeader 
        dayName={dayName}
        date={date}
        isToday={isToday}
      />

      {/* Eden's Intro - Only for today */}
      {edenIntro && isToday && (
        <div className="card bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 text-sm">E</span>
            </div>
            <p className="text-foreground-muted text-sm leading-relaxed">
              {edenIntro}
            </p>
          </div>
        </div>
      )}

      {/* Priority Items */}
      {priorityItems.length > 0 && (
        <div className="space-y-3">
          {priorityItems.map(item => (
            <PlanItemCard 
              key={item.id} 
              item={item} 
              isPriority={true}
            />
          ))}
        </div>
      )}

      {/* Other Items */}
      {otherItems.length > 0 && (
        <div className="space-y-3">
          {otherItems.map(item => (
            <PlanItemCard 
              key={item.id} 
              item={item} 
              isPriority={false}
            />
          ))}
        </div>
      )}

      {/* Past Day Summary */}
      {isPast && (
        <DaySummary items={items} />
      )}
    </div>
  );
}

function DayHeader({ dayName, date, isToday }: { 
  dayName: string; 
  date: Date; 
  isToday: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-xl font-semibold">
        {isToday ? 'Today' : dayName}
      </h2>
      <span className="text-foreground-muted text-sm">
        {format(date, 'MMM d')}
      </span>
      {isToday && (
        <span className="text-green-400 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10">
          Today
        </span>
      )}
    </div>
  );
}

function DaySummary({ items }: { items: PlanItem[] }) {
  const completed = items.filter(i => i.status === 'done').length;
  const skipped = items.filter(i => i.status === 'skipped').length;
  const pending = items.filter(i => i.status === 'pending').length;
  const total = items.length;

  return (
    <div className="card bg-background-tertiary/50 border-muted">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground-muted">Day Summary</span>
        <div className="flex items-center gap-3">
          {completed > 0 && (
            <span className="text-green-400">✓ {completed}</span>
          )}
          {skipped > 0 && (
            <span className="text-foreground-subtle">⊘ {skipped}</span>
          )}
          {pending > 0 && (
            <span className="text-yellow-400">○ {pending}</span>
          )}
        </div>
      </div>
    </div>
  );
}

