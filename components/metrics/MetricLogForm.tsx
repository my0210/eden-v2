'use client';

import { useState } from 'react';
import { MetricDefinition, MetricSource, DOMAIN_COLORS, Domain } from '@/lib/types';

interface MetricLogFormProps {
  metric: MetricDefinition;
  onClose: () => void;
  onSuccess: () => void;
}

const SOURCE_OPTIONS: { value: MetricSource; label: string }[] = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'apple_health', label: 'Apple Health' },
  { value: 'garmin', label: 'Garmin' },
  { value: 'whoop', label: 'WHOOP' },
  { value: 'oura', label: 'Oura' },
  { value: 'lab', label: 'Lab Test' },
  { value: 'other', label: 'Other' },
];

export function MetricLogForm({ metric, onClose, onSuccess }: MetricLogFormProps) {
  const [value, setValue] = useState('');
  const [source, setSource] = useState<MetricSource>('manual');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domainColor = DOMAIN_COLORS[metric.domain as Domain];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value) {
      setError('Please enter a value');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
      return;
    }

    // Validate scale_1_10
    if (metric.valueType === 'scale_1_10' && (numValue < 1 || numValue > 10)) {
      setError('Value must be between 1 and 10');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/metrics/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricDefinitionId: metric.id,
          value: numValue,
          source,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to log entry');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get placeholder text based on metric type
  const getPlaceholder = () => {
    if (metric.valueType === 'scale_1_10') return '1-10';
    if (metric.valueType === 'duration') return 'e.g., 45 (minutes)';
    if (metric.unit) return `e.g., ${metric.unit}`;
    return 'Enter value';
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Form Panel */}
      <div 
        className="relative w-full max-w-md bg-background rounded-t-2xl"
        style={{ 
          backgroundColor: 'rgba(28, 28, 30, 0.98)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-white/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4">
          <h2 className="text-lg font-medium text-foreground/90">Log {metric.name}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground/60 hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
          {/* Value Input */}
          <div>
            <label className="text-xs text-foreground/50 mb-2 block">
              Value {metric.unit && `(${metric.unit})`}
            </label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full px-4 py-3 rounded-xl text-lg text-foreground/90 placeholder-foreground/30 focus:outline-none focus:ring-2 transition-all"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.06)',
                // @ts-ignore
                '--tw-ring-color': domainColor,
              }}
              autoFocus
            />
          </div>

          {/* Source Select */}
          <div>
            <label className="text-xs text-foreground/50 mb-2 block">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as MetricSource)}
              className="w-full px-4 py-3 rounded-xl text-sm text-foreground/90 focus:outline-none focus:ring-2 transition-all appearance-none"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-foreground/50 mb-2 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm text-foreground/90 placeholder-foreground/30 focus:outline-none focus:ring-2 resize-none transition-all"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400/80 text-sm">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !value}
            className="w-full py-3.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: value ? domainColor : 'rgba(255,255,255,0.1)',
              color: value ? 'white' : 'rgba(255,255,255,0.3)',
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Entry'
            )}
          </button>
        </form>

        {/* Safe area */}
        <div className="h-4 safe-area-bottom" />
      </div>
    </div>
  );
}
