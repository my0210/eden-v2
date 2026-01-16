'use client';

import { MetricWithLatestValue, UnitPreferences } from '@/lib/types';
import { MetricRow } from './MetricRow';
import { computeAverageScore, computeMetricScore } from '@/lib/scoring';

interface SubDomainSectionProps {
  subDomain: string;
  metrics: MetricWithLatestValue[];
  domainColor: string;
  unitSystem: 'metric' | 'imperial';
  unitPreferences?: UnitPreferences;
}

export function SubDomainSection({ subDomain, metrics, domainColor, unitSystem, unitPreferences }: SubDomainSectionProps) {
  if (metrics.length === 0) {
    return null;
  }

  const scoredValues = metrics
    .map(metric => {
      if (!metric.latestEntry || !metric.scoring) return null;
      return computeMetricScore(metric.latestEntry.value, metric.scoring);
    })
    .filter((score): score is number => typeof score === 'number');

  const minimumCount = Math.max(2, Math.ceil(metrics.length * 0.3));
  const subDomainScore = computeAverageScore(scoredValues, minimumCount);

  return (
    <div className="py-2">
      {/* Sub-domain header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span 
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: domainColor, opacity: 0.6 }}
        >
          {subDomain}
        </span>
        <span className="text-[10px] text-foreground/30">
          {subDomainScore !== null ? `${subDomainScore} score` : '—'}
        </span>
      </div>
      
      {/* Metrics list */}
      <div className="space-y-0.5">
        {metrics.map((metric) => (
          <MetricRow 
            key={metric.definition.id} 
            metric={metric}
            unitSystem={unitSystem}
            unitPreferences={unitPreferences}
          />
        ))}
      </div>
    </div>
  );
}
