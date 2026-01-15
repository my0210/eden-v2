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
            <p className="text-xs text-foreground/30 mb-2">Tap an entry to edit or delete</p>
            <div 
              className="rounded-xl divide-y divide-white/5 overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              {entries.slice(0, 20).map((entry) => (
                <div key={entry.id}>
                  <button
                    onClick={() => toggleEntryActions(entry.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="text-sm text-foreground/70">
                        {formatValue(entry.value, entry.unit || definition.unit)}
                      </div>
                      <div className="text-xs text-foreground/30">
                        {format(new Date(entry.recordedAt), 'MMM d, yyyy • h:mm a')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground/30 capitalize">
                        {entry.source}
                      </span>
                      <svg 
                        className={`w-4 h-4 text-foreground/30 transition-transform ${selectedEntryId === entry.id ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* Action buttons */}
                  {selectedEntryId === entry.id && (
                    <div className="px-4 pb-3 flex gap-2">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-foreground/70 hover:text-foreground/90 transition-colors"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
                        style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
                      >
                        {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
