'use client';

import { useState } from 'react';
import { MetricWithLatestValue, UnitPreferences, UnitSystem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { MetricDetailView } from './MetricDetailView';
import { formatDurationMinutes, toDisplayValue, inferUnitType } from '@/lib/units';

interface MetricRowProps {
  metric: MetricWithLatestValue;
  unitSystem: UnitSystem;
  unitPreferences?: UnitPreferences;
}

export function MetricRow({ metric, unitSystem, unitPreferences }: MetricRowProps) {
  const [showDetail, setShowDetail] = useState(false);
  
  const { definition, latestEntry } = metric;
  
  // Format the value for display
  const formatValue = () => {
    if (!latestEntry) return '—';
    
    const value = latestEntry.value;
    const unitType = definition.unitType || inferUnitType(definition.unit, definition.valueType);
    const unit = latestEntry.unit || definition.canonicalUnit || definition.unit || '';
    
    // Format based on value type
    if (definition.valueType === 'scale_1_10') {
      return `${value}/10`;
    }
    
    if (definition.valueType === 'duration') {
      return formatDurationMinutes(value);
    }

    const converted = toDisplayValue(value, unitType, unitSystem, unitPreferences);
    const displayValue = converted.value;
    const displayUnit = converted.unit || unit;
    
    // Number with unit
    if (typeof displayValue === 'number') {
      // Format with appropriate precision
      const formatted = Number.isInteger(displayValue) ? displayValue : displayValue.toFixed(1);
      return displayUnit ? `${formatted} ${displayUnit}` : formatted;
    }
    
    return `${displayValue}${displayUnit ? ' ' + displayUnit : ''}`;
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
          unitSystem={unitSystem}
          unitPreferences={unitPreferences}
        />
      )}
    </>
  );
}
