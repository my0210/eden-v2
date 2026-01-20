'use client';

import Link from 'next/link';

interface EdenHeaderProps {
  message: string;
  showProtocolLink?: boolean;
}

export function EdenHeader({ message, showProtocolLink = true }: EdenHeaderProps) {
  return (
    <div className="px-6 space-y-2">
      {/* Dynamic Eden Message */}
      <div 
        className="rounded-xl p-4 transition-all duration-300"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.06)',
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        <p className="text-sm text-foreground/70 leading-relaxed">
          {message}
        </p>
      </div>
      
      {/* Protocol Link */}
      {showProtocolLink && (
        <div className="flex justify-end">
          <Link 
            href="/protocol"
            className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors flex items-center gap-1"
          >
            View protocol
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
