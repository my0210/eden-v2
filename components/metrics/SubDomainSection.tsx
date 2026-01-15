'use client';

import { MetricWithLatestValue } from '@/lib/types';
import { MetricRow } from './MetricRow';

interface SubDomainSectionProps {
  subDomain: string;
  metrics: MetricWithLatestValue[];
  domainColor: string;
}

export function SubDomainSection({ subDomain, metrics, domainColor }: SubDomainSectionProps) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="py-2">
      {/* Sub-domain header */}
      <div className="px-4 py-2">
        <span 
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: domainColor, opacity: 0.6 }}
        >
          {subDomain}
        </span>
      </div>
      
      {/* Metrics list */}
      <div className="space-y-0.5">
        {metrics.map((metric) => (
          <MetricRow 
            key={metric.definition.id} 
            metric={metric}
          />
        ))}
      </div>
    </div>
  );
}
