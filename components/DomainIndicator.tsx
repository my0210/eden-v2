'use client';

import { PlanItem, Domain, DOMAINS, DOMAIN_COLORS } from '@/lib/types';

interface DomainIndicatorProps {
  items: PlanItem[];
}

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
    <div className="flex items-center justify-center gap-3">
      {DOMAINS.map(domain => {
        const stats = domainStats[domain];
        const color = DOMAIN_COLORS[domain];
        const hasItems = stats.total > 0;
        const isComplete = stats.percentage === 100;
        
        return (
          <div
            key={domain}
            className="flex items-center justify-center"
            title={`${domain}: ${stats.completed}/${stats.total}`}
          >
            <div
              className="w-2 h-2 rounded-full transition-all duration-500"
              style={{
                backgroundColor: hasItems ? color : 'rgba(255,255,255,0.1)',
                opacity: hasItems ? (isComplete ? 1 : 0.4) : 0.2,
                boxShadow: isComplete ? `0 0 8px ${color}` : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
