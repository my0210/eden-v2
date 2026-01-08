'use client';

import { PlanItem, Domain, DOMAINS, DOMAIN_LABELS, DOMAIN_COLORS } from '@/lib/types';

interface DomainIndicatorProps {
  items: PlanItem[];
}

export function DomainIndicator({ items }: DomainIndicatorProps) {
  // Calculate completion per domain for the week
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
    <div className="flex items-center justify-between gap-2">
      {DOMAINS.map(domain => {
        const stats = domainStats[domain];
        const color = DOMAIN_COLORS[domain];
        const hasItems = stats.total > 0;
        
        return (
          <div
            key={domain}
            className="flex-1 flex flex-col items-center gap-1"
          >
            {/* Domain dot with progress ring */}
            <div className="relative">
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  transition-all duration-300
                `}
                style={{
                  backgroundColor: hasItems 
                    ? `${color}${stats.percentage === 100 ? '40' : '20'}`
                    : 'var(--background-tertiary)',
                  boxShadow: stats.percentage === 100 
                    ? `0 0 8px ${color}40`
                    : 'none',
                }}
              >
                {/* Inner dot */}
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: hasItems ? color : 'var(--foreground-subtle)',
                    opacity: hasItems ? (stats.percentage > 0 ? 1 : 0.5) : 0.3,
                  }}
                />
              </div>
              
              {/* Completion indicator */}
              {hasItems && stats.percentage === 100 && (
                <span 
                  className="absolute -bottom-0.5 -right-0.5 text-[8px]"
                  style={{ color }}
                >
                  ✓
                </span>
              )}
            </div>

            {/* Domain label */}
            <span 
              className="text-[10px] font-medium truncate w-full text-center"
              style={{ 
                color: hasItems ? color : 'var(--foreground-subtle)',
                opacity: hasItems ? 1 : 0.5,
              }}
            >
              {DOMAIN_LABELS[domain].slice(0, 4)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

