'use client';

import { useState, useEffect } from 'react';
import { Domain, DOMAIN_LABELS, DOMAIN_COLORS, DOMAIN_SUBDOMAINS, MetricDefinition, MetricWithLatestValue } from '@/lib/types';
import { SubDomainSection } from './SubDomainSection';
import { computeAverageScore, computeMetricScore } from '@/lib/scoring';

interface DomainCardProps {
  domain: Domain;
}

// Domain icons
function DomainIcon({ domain, color, size = 18 }: { domain: Domain; color: string; size?: number }) {
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
    case 'frame':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      );
    case 'recovery':
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

interface MetricsBySubDomain {
  [subDomain: string]: MetricWithLatestValue[];
}

export function DomainCard({ domain }: DomainCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<MetricsBySubDomain>({});
  const [isLoading, setIsLoading] = useState(false);
  const [totalMetrics, setTotalMetrics] = useState(0);
  const [trackedMetrics, setTrackedMetrics] = useState(0);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [unitPreferences, setUnitPreferences] = useState<{ glucoseUnit?: string; lipidsUnit?: string }>({});

  const color = DOMAIN_COLORS[domain];
  const label = DOMAIN_LABELS[domain];
  const subDomains = DOMAIN_SUBDOMAINS[domain];
  const allMetrics = Object.values(metrics).flat();
  const scoredValues = allMetrics
    .map(metric => {
      if (!metric.latestEntry || !metric.scoring) return null;
      return computeMetricScore(metric.latestEntry.value, metric.scoring);
    })
    .filter((score): score is number => typeof score === 'number');
  const minimumCount = Math.max(3, Math.ceil(allMetrics.length * 0.3));
  const domainScore = computeAverageScore(scoredValues, minimumCount);

  // Fetch metrics when card is expanded
  useEffect(() => {
    if (isExpanded && Object.keys(metrics).length === 0) {
      fetchMetrics();
    }
  }, [isExpanded]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/metrics/definitions?domain=${domain}`);
      if (response.ok) {
        const data = await response.json();
        
        // Group by sub-domain
        const grouped: MetricsBySubDomain = {};
        let total = 0;
        let tracked = 0;
        
        data.definitions?.forEach((def: MetricDefinition) => {
          if (!grouped[def.subDomain]) {
            grouped[def.subDomain] = [];
          }
          grouped[def.subDomain].push({
            definition: def,
            latestEntry: data.latestEntries?.[def.id],
            scoring: data.scoring?.[def.id],
          });
          total++;
          if (data.latestEntries?.[def.id]) {
            tracked++;
          }
        });
        
        setMetrics(grouped);
        setTotalMetrics(total);
        setTrackedMetrics(tracked);
        if (data.unitSystem === 'imperial') {
          setUnitSystem('imperial');
        } else {
          setUnitSystem('metric');
        }
        setUnitPreferences(data.unitPreferences || {});
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
    setIsLoading(false);
  };

  return (
    <div 
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: isExpanded ? color : 'rgba(255,255,255,0.06)',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      {/* Card Header - Always visible, clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <DomainIcon domain={domain} color={color} />
          <div className="text-left">
            <div 
              className="text-sm font-medium"
              style={{ color }}
            >
              {label}
            </div>
            <div className="text-xs text-foreground/40">
              {totalMetrics > 0 
                ? `${trackedMetrics} of ${totalMetrics} metrics tracked` 
                : 'Tap to explore metrics'
              }
            </div>
            <div className="text-[10px] text-foreground/30">
              {domainScore !== null ? `Score ${domainScore}` : 'Score —'}
            </div>
          </div>
        </div>
        
        {/* Chevron */}
        <svg 
          className={`w-5 h-5 text-foreground/30 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/5">
          {isLoading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-block w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {subDomains.map((subDomain) => (
                <SubDomainSection
                  key={subDomain}
                  subDomain={subDomain}
                  metrics={metrics[subDomain] || []}
                  domainColor={color}
                  unitSystem={unitSystem}
                  unitPreferences={unitPreferences}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
