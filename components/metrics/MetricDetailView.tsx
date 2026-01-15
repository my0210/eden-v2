'use client';

import { useState, useEffect } from 'react';
import { MetricDefinition, UserMetricEntry, DOMAIN_COLORS, Domain } from '@/lib/types';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { MetricLogForm } from './MetricLogForm';
import { MetricEditForm } from './MetricEditForm';

interface MetricDetailViewProps {
  metricId: string;
  onClose: () => void;
}

interface MetricData {
  definition: MetricDefinition;
  entries: UserMetricEntry[];
}

export function MetricDetailView({ metricId, onClose }: MetricDetailViewProps) {
  const [data, setData] = useState<MetricData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<UserMetricEntry | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMetricData();
  }, [metricId]);

  const fetchMetricData = async () => {
    setIsLoading(true);
    try {
      // Fetch entries for this metric
      const response = await fetch(`/api/metrics/entries?metricId=${metricId}&limit=100`);
      if (response.ok) {
        const result = await response.json();
        
        // Get definition from the first entry or fetch separately
        if (result.entries.length > 0 && result.entries[0].metricDefinition) {
          setData({
            definition: result.entries[0].metricDefinition,
            entries: result.entries,
          });
        } else {
          // Fetch definition separately
          const defResponse = await fetch(`/api/metrics/definitions`);
          if (defResponse.ok) {
            const defResult = await defResponse.json();
            const def = defResult.definitions.find((d: MetricDefinition) => d.id === metricId);
            if (def) {
              setData({
                definition: def,
                entries: result.entries || [],
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch metric data:', error);
    }
    setIsLoading(false);
  };

  const handleLogSuccess = () => {
    setShowLogForm(false);
    fetchMetricData(); // Refresh data
  };

  const handleEditSuccess = () => {
    setEditingEntry(null);
    setSelectedEntryId(null);
    fetchMetricData(); // Refresh data
  };

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId);
    try {
      const response = await fetch(`/api/metrics/entries?id=${entryId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSelectedEntryId(null);
        fetchMetricData(); // Refresh data
      } else {
        console.error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
    setDeletingId(null);
  };

  const toggleEntryActions = (entryId: string) => {
    setSelectedEntryId(selectedEntryId === entryId ? null : entryId);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[80] bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-[80] bg-background flex flex-col items-center justify-center p-6">
        <p className="text-foreground/60">Failed to load metric data</p>
        <button onClick={onClose} className="mt-4 text-foreground/40 hover:text-foreground/60">
          Go back
        </button>
      </div>
    );
  }

  const { definition, entries } = data;
  const latestEntry = entries[0];
  const previousEntry = entries[1];
  const domainColor = DOMAIN_COLORS[definition.domain as Domain];

  // Calculate delta if we have two entries
  const delta = latestEntry && previousEntry 
    ? latestEntry.value - previousEntry.value 
    : null;
  
  // Determine trend
  const trend = delta === null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';

  // Format value for display
  const formatValue = (value: number, unit?: string) => {
    if (definition.valueType === 'scale_1_10') {
      return `${value}/10`;
    }
    if (definition.valueType === 'duration') {
      if (value >= 3600) return `${(value / 3600).toFixed(1)}h`;
      if (value >= 60) return `${Math.round(value / 60)}m`;
      return `${value}s`;
    }
    const formatted = Number.isInteger(value) ? value : value.toFixed(1);
    return unit ? `${formatted} ${unit}` : `${formatted}`;
  };

  // Calculate chart data (last 30 days)
  const chartData = entries
    .filter(e => new Date(e.recordedAt) >= subDays(new Date(), 30))
    .reverse();

  const maxValue = Math.max(...chartData.map(e => e.value), 1);
  const minValue = Math.min(...chartData.map(e => e.value), 0);
  const range = maxValue - minValue || 1;

  return (
    <div className="fixed inset-0 z-[80] bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-foreground/60 hover:text-foreground/80 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="text-sm">Back</span>
          </button>
          
          <span 
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: domainColor }}
          >
            {definition.subDomain}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Metric Name & Current Value */}
        <div className="text-center space-y-3">
          <h1 className="text-xl font-medium text-foreground/90">{definition.name}</h1>
          
          {latestEntry ? (
            <div className="space-y-1">
              <div className="text-4xl font-light text-foreground/90">
                {formatValue(latestEntry.value, latestEntry.unit || definition.unit)}
              </div>
              {delta !== null && (
                <div className={`text-sm ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-foreground/40'}`}>
                  {trend === 'up' && '↑ '}
                  {trend === 'down' && '↓ '}
                  {trend === 'stable' && '→ '}
                  {delta > 0 ? '+' : ''}{formatValue(delta, definition.unit)} from previous
                </div>
              )}
              <div className="text-xs text-foreground/40">
                {formatDistanceToNow(new Date(latestEntry.recordedAt), { addSuffix: true })}
              </div>
            </div>
          ) : (
            <div className="text-2xl text-foreground/30">No data yet</div>
          )}
        </div>

        {/* Log Entry Button */}
        <button
          onClick={() => setShowLogForm(true)}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98]"
          style={{ 
            backgroundColor: `${domainColor}20`,
            color: domainColor,
          }}
        >
          + Log Entry
        </button>

        {/* Trend Chart */}
        {chartData.length > 1 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
              Last 30 Days
            </h2>
            <div 
              className="h-32 rounded-xl p-4 flex items-end gap-1"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              {chartData.map((entry, i) => {
                const height = ((entry.value - minValue) / range) * 100;
                return (
                  <div
                    key={entry.id}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${Math.max(height, 5)}%`,
                      backgroundColor: domainColor,
                      opacity: 0.3 + (i / chartData.length) * 0.7,
                    }}
                    title={`${formatValue(entry.value, definition.unit)} on ${format(new Date(entry.recordedAt), 'MMM d')}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* What It Tells You */}
        {definition.whatItTellsYou && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
              What It Tells You
            </h2>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {definition.whatItTellsYou}
            </p>
          </div>
        )}

        {/* Measurement Sources */}
        {definition.measurementSources && definition.measurementSources.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
              How to Measure
            </h2>
            <div className="flex flex-wrap gap-2">
              {definition.measurementSources.map((source, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 text-xs text-foreground/50 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Entry History */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
              History
            </h2>
            <div 
              className="rounded-xl divide-y divide-white/5"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              {entries.slice(0, 20).map((entry) => (
                <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground/70">
                      {formatValue(entry.value, entry.unit || definition.unit)}
                    </div>
                    <div className="text-xs text-foreground/30">
                      {format(new Date(entry.recordedAt), 'MMM d, yyyy • h:mm a')}
                      <span className="ml-2 capitalize">{entry.source}</span>
                    </div>
                  </div>
                  
                  {/* Three-dot menu */}
                  <button
                    onClick={() => toggleEntryActions(entry.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/30 hover:text-foreground/60 hover:bg-white/5 transition-colors"
                    aria-label="Entry options"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Sheet for entry options */}
        {selectedEntryId && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60"
              onClick={() => setSelectedEntryId(null)}
            />
            
            {/* Action Sheet */}
            <div 
              className="relative w-full max-w-md mb-safe rounded-t-2xl overflow-hidden"
              style={{ backgroundColor: 'rgba(38, 38, 40, 0.98)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 rounded-full bg-white/30" />
              </div>
              
              <div className="px-4 pb-6 space-y-2">
                <button
                  onClick={() => {
                    const entry = entries.find(e => e.id === selectedEntryId);
                    if (entry) setEditingEntry(entry);
                    setSelectedEntryId(null);
                  }}
                  className="w-full px-4 py-3.5 rounded-xl text-left text-base text-foreground/90 hover:bg-white/10 transition-colors flex items-center gap-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                >
                  <svg className="w-5 h-5 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  Edit Entry
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedEntryId);
                    setSelectedEntryId(null);
                  }}
                  disabled={deletingId === selectedEntryId}
                  className="w-full px-4 py-3.5 rounded-xl text-left text-base text-red-400 hover:bg-white/10 transition-colors flex items-center gap-3 disabled:opacity-50"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  {deletingId === selectedEntryId ? 'Deleting...' : 'Delete Entry'}
                </button>
                <button
                  onClick={() => setSelectedEntryId(null)}
                  className="w-full px-4 py-3.5 rounded-xl text-center text-base text-foreground/50 hover:bg-white/5 transition-colors mt-2"
                >
                  Cancel
                </button>
              </div>
              
              {/* Safe area */}
              <div className="h-4 safe-area-bottom" />
            </div>
          </div>
        )}
      </div>

      {/* Log Form Modal */}
      {showLogForm && (
        <MetricLogForm
          metric={definition}
          onClose={() => setShowLogForm(false)}
          onSuccess={handleLogSuccess}
        />
      )}

      {/* Edit Form Modal */}
      {editingEntry && (
        <MetricEditForm
          metric={definition}
          entry={editingEntry}
          onClose={() => {
            setEditingEntry(null);
            setSelectedEntryId(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
