'use client';

import { PlanItem, Domain, DOMAINS, DOMAIN_COLORS } from '@/lib/types';

interface DomainIndicatorProps {
  items: PlanItem[];
}

const DOMAIN_SHORT_LABELS: Record<Domain, string> = {
  heart: 'Heart',
  muscle: 'Muscle',
  sleep: 'Sleep',
  metabolism: 'Metab',
  mind: 'Mind',
};

export function DomainIndicator({ items }: DomainIndicatorProps) {
  const domainStats = DOMAINS.reduce((acc, domain) => {
    const domainItems = items.filter(item => item.domain === domain);
    const completed = domainItems.filter(item => item.status === 'done').length;
    const total = domainItems.length;
    
    acc[domain] = {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
    
    return acc;
  }, {} as Record<Domain, { total: number; completed: number; percentage: number }>);

  return (
    <div className="flex items-stretch gap-1 w-full">
      {DOMAINS.map(domain => {
        const stats = domainStats[domain];
        const color = DOMAIN_COLORS[domain];
        const hasItems = stats.total > 0;
        const isComplete = stats.percentage === 100;
        const percentage = stats.percentage;
        
        return (
          <div
            key={domain}
            className="flex-1 flex flex-col items-center gap-1"
            title={`${DOMAIN_SHORT_LABELS[domain]}: ${stats.completed}/${stats.total}`}
          >
            {/* Label */}
            <span 
              className="text-[10px] uppercase tracking-wider transition-opacity duration-300"
              style={{ 
                color: hasItems ? color : 'rgba(255,255,255,0.2)',
                opacity: hasItems ? 0.7 : 0.3,
              }}
            >
              {DOMAIN_SHORT_LABELS[domain]}
            </span>
            
            {/* Progress bar */}
            <div 
              className="w-full h-1.5 rounded-full overflow-hidden transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: hasItems ? `${Math.max(percentage, 8)}%` : '0%',
                  backgroundColor: color,
                  opacity: hasItems ? (percentage > 0 ? 0.4 + (percentage / 100) * 0.6 : 0.2) : 0,
                  boxShadow: isComplete ? `0 0 8px ${color}` : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
