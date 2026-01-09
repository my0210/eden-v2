'use client';

import { format } from 'date-fns';
import { PlanItem, DAY_FULL_LABELS, DayOfWeek } from '@/lib/types';
import { PlanItemCard } from './PlanItemCard';

interface DayViewProps {
  date: Date;
  items: PlanItem[];
  isToday: boolean;
  isPast: boolean;
}

export function DayView({ date, items, isToday, isPast }: DayViewProps) {
  const dayOfWeek = date.getDay() as DayOfWeek;
  const dayName = DAY_FULL_LABELS[dayOfWeek];
  
  const priorityItems = items.filter(item => item.sortOrder === 0);
  const otherItems = items.filter(item => item.sortOrder !== 0);

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <DayHeader dayName={dayName} date={date} isToday={isToday} />
        
        <div className="text-center py-12">
          <p className="text-foreground/30">
            {isPast 
              ? 'Nothing scheduled'
              : 'No items yet'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DayHeader dayName={dayName} date={date} isToday={isToday} />

      {/* Items */}
      <div className="space-y-3">
        {priorityItems.map(item => (
          <PlanItemCard key={item.id} item={item} isPriority={true} />
        ))}
        {otherItems.map(item => (
          <PlanItemCard key={item.id} item={item} isPriority={false} />
        ))}
      </div>

      {/* Past Day Summary */}
      {isPast && <DaySummary items={items} />}
    </div>
  );
}

function DayHeader({ dayName, date, isToday }: { 
  dayName: string; 
  date: Date; 
  isToday: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 className="text-2xl font-light">
        {isToday ? 'Today' : dayName}
      </h2>
      <span className="text-foreground/30 text-sm">
        {format(date, 'MMM d')}
      </span>
    </div>
  );
}

function DaySummary({ items }: { items: PlanItem[] }) {
  const completed = items.filter(i => i.status === 'done').length;
  const total = items.length;

  return (
    <div className="text-center pt-4">
      <span className="text-foreground/30 text-sm">
        {completed}/{total} completed
      </span>
    </div>
  );
}
