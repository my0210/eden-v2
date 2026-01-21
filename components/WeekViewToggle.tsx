'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface WeekViewToggleProps {
  currentView: 'domain' | 'day';
}

export function WeekViewToggle({ currentView }: WeekViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleToggle = (view: 'domain' | 'day') => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'domain') {
      params.delete('day');
      params.set('view', 'domain');
    } else {
      params.delete('view');
      // Keep day param if it exists, otherwise don't set it
    }
    router.push(`/week?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/5">
      <button
        onClick={() => handleToggle('domain')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          currentView === 'domain'
            ? 'bg-white/10 text-foreground/80'
            : 'text-foreground/40 hover:text-foreground/60'
        }`}
      >
        By Domain
      </button>
      <button
        onClick={() => handleToggle('day')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          currentView === 'day'
            ? 'bg-white/10 text-foreground/80'
            : 'text-foreground/40 hover:text-foreground/60'
        }`}
      >
        By Day
      </button>
    </div>
  );
}
