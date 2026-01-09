'use client';

import { useState } from 'react';
import { PlanItem, Domain, DOMAINS, DOMAIN_COLORS, DOMAIN_LABELS } from '@/lib/types';

interface WeekHeaderProps {
  edenIntro: string;
  domainIntros: Partial<Record<Domain, string>>;
  items: PlanItem[];
}

// Domain icons
function DomainIcon({ domain, color, size = 14 }: { domain: Domain; color: string; size?: number }) {
  const iconProps = {
    width: size,
    height: size,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: color,
    strokeWidth: 1.5,
  };

  switch (domain) {
    case 'heart':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      );
    case 'muscle':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l1-3 2 6 2-6 2 6 1-3h2M17 8v8M21 8v8M17 12h4" />
        </svg>
      );
    case 'sleep':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      );
    case 'metabolism':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
        </svg>
      );
    case 'mind':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function WeekHeader({ edenIntro, domainIntros, items }: WeekHeaderProps) {
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  // Calculate stats for each domain
  const domainStats = DOMAINS.reduce((acc, domain) => {
    const domainItems = items.filter(item => item.domain === domain);
    const completed = domainItems.filter(item => item.status === 'done').length;
    const total = domainItems.length;
    
    acc[domain] = { total, completed };
    return acc;
  }, {} as Record<Domain, { total: number; completed: number }>);

  // Get current intro text
  const currentIntro = selectedDomain 
    ? domainIntros[selectedDomain] || `No specific focus for ${DOMAIN_LABELS[selectedDomain]} this week.`
    : edenIntro;

  // Get current label
  const currentLabel = selectedDomain 
    ? DOMAIN_LABELS[selectedDomain]
    : null;

  const handleDomainClick = (domain: Domain) => {
    if (selectedDomain === domain) {
      setSelectedDomain(null); // Deselect
    } else {
      setSelectedDomain(domain); // Select new
    }
  };

  return (
    <div className="space-y-3">
      {/* Intro Text */}
      <div className="px-6 py-3">
        {selectedDomain && (
          <div className="flex items-center gap-2 mb-2">
            <DomainIcon 
              domain={selectedDomain} 
              color={DOMAIN_COLORS[selectedDomain]} 
              size={16} 
            />
            <span 
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: DOMAIN_COLORS[selectedDomain] }}
            >
              {currentLabel}
            </span>
            <button
              onClick={() => setSelectedDomain(null)}
              className="ml-auto text-foreground/30 hover:text-foreground/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <p className="text-sm text-foreground/50 leading-relaxed transition-all duration-300">
          {currentIntro}
        </p>
      </div>

      {/* Domain Indicator */}
      <div className="px-6 py-2">
        <div className="flex items-stretch gap-2 w-full">
          {DOMAINS.map(domain => {
            const stats = domainStats[domain];
            const color = DOMAIN_COLORS[domain];
            const hasItems = stats.total > 0;
            const isSelected = selectedDomain === domain;
            const percentage = hasItems ? Math.round((stats.completed / stats.total) * 100) : 0;
            const isComplete = percentage === 100 && hasItems;
            
            return (
              <button
                key={domain}
                onClick={() => handleDomainClick(domain)}
                className={`
                  flex-1 flex flex-col items-center gap-1.5
                  py-2 rounded-lg transition-all duration-300
                  ${isSelected 
                    ? 'bg-white/10 ring-1 ring-white/20' 
                    : 'hover:bg-white/5'
                  }
                `}
              >
                {/* Icon + Name */}
                <div className="flex items-center gap-1">
                  <DomainIcon 
                    domain={domain} 
                    color={hasItems ? color : 'rgba(255,255,255,0.25)'} 
                    size={12}
                  />
                  <span 
                    className="text-[9px] uppercase tracking-wide font-medium"
                    style={{ 
                      color: hasItems ? color : 'rgba(255,255,255,0.25)',
                      opacity: hasItems ? 0.8 : 0.4,
                    }}
                  >
                    {DOMAIN_LABELS[domain] === 'Metabolism' ? 'Metab' : DOMAIN_LABELS[domain]}
                  </span>
                </div>
                
                {/* Progress bar with count overlay */}
                <div 
                  className="relative w-full h-4 rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: hasItems ? `${Math.max(percentage, 8)}%` : '0%',
                      backgroundColor: color,
                      opacity: hasItems ? (percentage > 0 ? 0.3 + (percentage / 100) * 0.5 : 0.15) : 0,
                      boxShadow: isComplete ? `0 0 8px ${color}` : 'none',
                    }}
                  />
                  <span 
                    className="relative z-10 text-[9px] tabular-nums font-medium"
                    style={{ 
                      color: hasItems ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                    }}
                  >
                    {stats.completed}/{stats.total}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

