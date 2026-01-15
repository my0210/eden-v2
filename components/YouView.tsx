'use client';

import { DOMAINS } from '@/lib/types';
import { DomainCard } from './metrics/DomainCard';

export function YouView() {
  return (
    <div className="px-6 py-4 space-y-3">
      {/* Domain Cards */}
      {DOMAINS.map((domain) => (
        <DomainCard key={domain} domain={domain} />
      ))}
      
      {/* Future: Add HealthKit connection prompt, etc. */}
    </div>
  );
}
