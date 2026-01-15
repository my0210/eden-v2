'use client';

import { useState } from 'react';
import { MetricWithLatestValue } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { MetricDetailView } from './MetricDetailView';

interface MetricRowProps {
  metric: MetricWithLatestValue;
}

export function MetricRow({ metric }: MetricRowProps) {
  const [showDetail, setShowDetail] = useState(false);
  
  const { definition, latestEntry } = metric;
  
  // Format the value for display
  const formatValue = () => {
    if (!latestEntry) return '—';
    
    const value = latestEntry.value;
    const unit = latestEntry.unit || definition.unit || '';
    
    // Format based on value type
    if (definition.valueType === 'scale_1_10') {
      return `${value}/10`;
    }
    
    if (definition.valueType === 'duration') {
      // Assume value is in seconds, format nicely
      if (value >= 3600) {
        return `${(value / 3600).toFixed(1)}h`;
      } else if (value >= 60) {
        return `${Math.round(value / 60)}m`;
      }
      return `${value}s`;
    }
    
    // Number with unit
    if (typeof value === 'number') {
      // Format with appropriate precision
      const formatted = Number.isInteger(value) ? value : value.toFixed(1);
      return unit ? `${formatted} ${unit}` : formatted;
    }
    
    return `${value}${unit ? ' ' + unit : ''}`;
  };
  
  // Format the time since last entry
  const formatTimeSince = () => {
    if (!latestEntry) return null;
    try {
      return formatDistanceToNow(new Date(latestEntry.recordedAt), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const timeSince = formatTimeSince();
  const hasValue = !!latestEntry;

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm text-foreground/70">
            {definition.name}
          </div>
          {timeSince && (
            <div className="text-[10px] text-foreground/30 mt-0.5">
              {timeSince}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span 
            className={`text-sm tabular-nums ${hasValue ? 'text-foreground/60' : 'text-foreground/20'}`}
          >
            {formatValue()}
          </span>
          <svg 
            className="w-4 h-4 text-foreground/20" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </button>

      {/* Metric Detail View */}
      {showDetail && (
        <MetricDetailView
          metricId={definition.id}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}
