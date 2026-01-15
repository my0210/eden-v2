'use client';

import Link from 'next/link';
import { DOMAINS } from '@/lib/types';
import { DomainCard } from '@/components/metrics/DomainCard';

export function YouPageClient() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-white/5" style={{ backgroundColor: '#0a0a0a' }}>
        <span className="text-lg font-medium text-foreground/80">You</span>
        <Link
          href="/week"
          className="
            w-9 h-9 rounded-full
            flex items-center justify-center
            text-foreground/40
            hover:text-foreground/60 hover:bg-white/5
            active:scale-95
            transition-all duration-200
          "
          aria-label="Close"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      </header>

      {/* Content */}
      <div className="px-6 py-4 space-y-3">
        {DOMAINS.map((domain) => (
          <DomainCard key={domain} domain={domain} />
        ))}
      </div>
    </div>
  );
}
