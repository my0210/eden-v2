'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { 
  Pillar, 
  PillarConfig, 
  CoreFiveLog,
  getPillarProgress,
} from '@/lib/v3/coreFive';
import { iconComponents } from './CoreFiveCard';

interface PillarDetailDrawerProps {
  pillar: Pillar;
  config: PillarConfig;
  logs: CoreFiveLog[];
  weekStart: string;
  readOnly?: boolean;
  onClose: () => void;
  onDelete: (logId: string) => void;
  onUpdate: (log: CoreFiveLog) => void;
  onLogNew: () => void;
}

function formatLogDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMM d');
}

function formatLogTime(dateStr: string): string {
  return format(parseISO(dateStr), 'h:mm a');
}

function getDetailTags(pillar: Pillar, details?: Record<string, unknown>): string[] {
  if (!details) return [];
  const tags: string[] = [];
  
  if (details.type && typeof details.type === 'string') {
    tags.push(details.type.charAt(0).toUpperCase() + details.type.slice(1));
  }
  if (details.intensity && typeof details.intensity === 'string') {
    tags.push(details.intensity.charAt(0).toUpperCase() + details.intensity.slice(1));
  }
  if (details.focus && typeof details.focus === 'string') {
    tags.push(details.focus.charAt(0).toUpperCase() + details.focus.slice(1));
  }
  if (details.quality && (typeof details.quality === 'string' || typeof details.quality === 'number')) {
    tags.push(`Quality ${details.quality}/5`);
  }
  
  return tags;
}

// Group logs by date
function groupLogsByDate(logs: CoreFiveLog[]): { date: string; label: string; entries: CoreFiveLog[] }[] {
  const sorted = [...logs].sort((a, b) => 
    new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  );

  const groups: Map<string, CoreFiveLog[]> = new Map();
  for (const log of sorted) {
    const dateKey = format(parseISO(log.loggedAt), 'yyyy-MM-dd');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(log);
  }

  return Array.from(groups.entries()).map(([dateKey, entries]) => ({
    date: dateKey,
    label: formatLogDate(entries[0].loggedAt),
    entries,
  }));
}

export function PillarDetailDrawer({
  pillar,
  config,
  logs,
  readOnly,
  onClose,
  onDelete,
  onLogNew,
}: PillarDetailDrawerProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const current = getPillarProgress(logs, pillar);
  const { name, weeklyTarget, unit, color, icon } = config;
  const progress = Math.min((current / weeklyTarget) * 100, 100);
  const isMet = current >= weeklyTarget;
  const IconComponent = iconComponents[icon];
  const grouped = groupLogsByDate(logs);

  const handleDelete = async (logId: string) => {
    setDeleting(logId);
    try {
      const res = await fetch(`/api/v3/log?id=${logId}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(logId);
        setConfirmDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete log:', error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Drawer.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 z-[100]"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        />
        
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col outline-none"
          style={{ 
            maxHeight: '85vh',
            backgroundColor: 'rgba(28, 28, 30, 0.98)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div 
              className="w-9 h-1 rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            />
          </div>

          {/* Header */}
          <div className="px-5 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 shadow-sm"
                  style={{ backgroundColor: `${color}20` }}
                >
                  {IconComponent && <IconComponent className="w-5 h-5" style={{ color }} />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white/90 leading-tight">{name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span 
                      className="text-sm font-medium tabular-nums"
                      style={{ color: isMet ? color : 'rgba(255,255,255,0.6)' }}
                    >
                      {current}
                    </span>
                    <span className="text-sm text-white/40">/ {weeklyTarget} {unit}</span>
                  </div>
                </div>
              </div>
              <Drawer.Close asChild>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Drawer.Close>
            </div>

            {/* Progress bar */}
            <div 
              className="h-2 rounded-full overflow-hidden bg-white/5 border border-white/5"
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: color,
                  opacity: isMet ? 1 : 0.7,
                  boxShadow: `0 0 10px ${color}40`
                }}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px mx-5 flex-shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Log entries */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/40 text-sm">No entries logged yet this week.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {grouped.map(group => (
                  <div key={group.date}>
                    <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                      {group.label}
                    </h3>
                    <div className="space-y-2">
                      {group.entries.map(log => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 rounded-xl"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span 
                                className="text-base font-medium tabular-nums"
                                style={{ color }}
                              >
                                {log.value} {unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {getDetailTags(pillar, log.details as Record<string, unknown>).map(tag => (
                                <span 
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ 
                                    backgroundColor: `${color}15`,
                                    color: `${color}cc`,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              <span className="text-xs text-white/30">
                                {formatLogTime(log.loggedAt)}
                              </span>
                            </div>
                            {(() => {
                              const d = log.details as Record<string, unknown> | undefined;
                              const notes = d && typeof d === 'object' && 'notes' in d ? String(d.notes) : null;
                              return notes ? (
                                <p className="text-xs text-white/40 mt-1 truncate">{notes}</p>
                              ) : null;
                            })()}
                          </div>

                          {/* Delete button */}
                          {!readOnly && (
                            <div className="ml-3 flex-shrink-0">
                              {confirmDelete === log.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(log.id)}
                                    disabled={deleting === log.id}
                                    className="px-2 py-1 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                  >
                                    {deleting === log.id ? '...' : 'Delete'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="px-2 py-1 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelete(log.id)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-red-400/60 hover:bg-red-500/10 transition-all"
                                  aria-label="Delete entry"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log button at bottom */}
          {!readOnly && (
            <div className="px-5 pb-4 pt-2 flex-shrink-0">
              <button
                onClick={onLogNew}
                className="w-full py-3 rounded-xl font-medium transition-all duration-200 hover:brightness-110 active:brightness-90"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                + Log {name}
              </button>
            </div>
          )}

          {/* Safe area */}
          <div className="h-4 flex-shrink-0 safe-area-bottom" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
