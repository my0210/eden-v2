'use client';

import { useState, useCallback } from 'react';
import { 
  Domain, 
  DOMAINS, 
  DOMAIN_LABELS, 
  DOMAIN_EMOJI, 
  DOMAIN_COLORS,
  PlanItem,
  PlannedActivity,
  ActivityLog,
  DayOfWeek,
  DAY_LABELS 
} from '@/lib/types';
import { ActivityLogger } from './ActivityLogger';

// ============================================================================
// Types
// ============================================================================

interface DomainProgress {
  logged: number;
  target: number;
  unit: string;
  count?: { logged: number; target: number };
}

interface DomainActivity {
  id: string;
  name: string;
  dayOfWeek?: DayOfWeek;
  targetValue?: number;
  targetUnit?: string;
  status: 'planned' | 'logged' | 'skipped' | 'target';
  details?: string;
  loggedValue?: number;
}

interface WeeklyDomainViewProps {
  // Legacy PlanItems (for backward compatibility)
  planItems?: PlanItem[];
  // New PlannedActivities
  plannedActivities?: PlannedActivity[];
  // Logged activities this week
  activityLogs?: ActivityLog[];
  // Domain progress summaries
  domainProgress?: Record<Domain, DomainProgress>;
  // Callback when user wants to add activity
  onAddActivity?: (domain: Domain) => void;
  // Callback when user taps an activity
  onActivityTap?: (activityId: string, status: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function WeeklyDomainView({
  planItems = [],
  plannedActivities = [],
  activityLogs = [],
  domainProgress,
  onAddActivity,
  onActivityTap,
}: WeeklyDomainViewProps) {
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [loggerDomain, setLoggerDomain] = useState<Domain | undefined>();

  // Group activities by domain from plan items
  const activitiesByDomain = groupActivitiesByDomain(planItems, plannedActivities, activityLogs);
  const progress = domainProgress || calculateProgressFromItems(planItems);

  const handleAddActivity = useCallback((domain: Domain) => {
    setLoggerDomain(domain);
    setLoggerOpen(true);
    onAddActivity?.(domain);
  }, [onAddActivity]);

  const handleLogActivity = useCallback((data: {
    activityId: string;
    domain: Domain;
    date: string;
    data: Record<string, unknown>;
    notes?: string;
  }) => {
    // In a full implementation, this would call an API to save the activity log
    console.log('Activity logged:', data);
    // For now, just close the logger
    setLoggerOpen(false);
    setLoggerDomain(undefined);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground/60 uppercase tracking-wider">
        This Week
      </h2>

      <div className="space-y-4">
        {DOMAINS.map(domain => (
          <DomainSection
            key={domain}
            domain={domain}
            activities={activitiesByDomain[domain] || []}
            progress={progress[domain]}
            onAddActivity={handleAddActivity}
            onActivityTap={onActivityTap}
          />
        ))}
      </div>

      {/* Activity Logger Modal */}
      <ActivityLogger
        domain={loggerDomain}
        isOpen={loggerOpen}
        onClose={() => {
          setLoggerOpen(false);
          setLoggerDomain(undefined);
        }}
        onLog={handleLogActivity}
      />
    </div>
  );
}

// ============================================================================
// Domain Section
// ============================================================================

interface DomainSectionProps {
  domain: Domain;
  activities: DomainActivity[];
  progress?: DomainProgress;
  onAddActivity?: (domain: Domain) => void;
  onActivityTap?: (activityId: string, status: string) => void;
}

function DomainSection({ 
  domain, 
  activities, 
  progress,
  onAddActivity,
  onActivityTap 
}: DomainSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const emoji = DOMAIN_EMOJI[domain];
  const label = DOMAIN_LABELS[domain];
  const color = DOMAIN_COLORS[domain];

  // Format progress display
  const progressText = formatProgress(progress);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      {/* Domain Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-medium text-foreground/80 uppercase tracking-wide text-sm">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span 
            className="text-sm font-mono"
            style={{ color }}
          >
            {progressText}
          </span>
          <svg
            className={`w-4 h-4 text-foreground/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Activities List */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {activities.length === 0 ? (
            <p className="text-foreground/30 text-sm py-2">No activities planned</p>
          ) : (
            activities.map(activity => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                color={color}
                onTap={onActivityTap}
              />
            ))
          )}

          {/* Add Activity Button */}
          <button
            onClick={() => onAddActivity?.(domain)}
            className="w-full py-2 text-sm text-foreground/40 hover:text-foreground/60 transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add activity
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Activity Row
// ============================================================================

interface ActivityRowProps {
  activity: DomainActivity;
  color: string;
  onTap?: (activityId: string, status: string) => void;
}

function ActivityRow({ activity, color, onTap }: ActivityRowProps) {
  const statusIcon = getStatusIcon(activity.status);
  const dayLabel = activity.dayOfWeek !== undefined 
    ? DAY_LABELS[activity.dayOfWeek as DayOfWeek]
    : 'Anytime';

  return (
    <button
      onClick={() => onTap?.(activity.id, activity.status)}
      className="w-full flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-white/[0.03] transition-colors text-left group"
    >
      {/* Status Icon */}
      <span 
        className={`text-lg ${activity.status === 'logged' ? '' : 'opacity-50'}`}
        style={{ color: activity.status === 'logged' ? color : undefined }}
      >
        {statusIcon}
      </span>

      {/* Activity Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${activity.status === 'logged' ? 'text-foreground/70' : 'text-foreground/50'}`}>
            {activity.name}
          </span>
          {activity.targetValue && activity.targetUnit && (
            <span className="text-xs text-foreground/30">
              · {activity.targetValue} {activity.targetUnit}
            </span>
          )}
        </div>
        {activity.details && (
          <p className="text-xs text-foreground/30 truncate">{activity.details}</p>
        )}
      </div>

      {/* Day Label */}
      <span className={`text-xs px-2 py-0.5 rounded ${
        activity.status === 'target' 
          ? 'text-foreground/30' 
          : 'text-foreground/40 bg-white/[0.03]'
      }`}>
        {activity.status === 'target' ? '[target]' : dayLabel}
      </span>

      {/* Status Badge */}
      <span className={`text-xs ${
        activity.status === 'logged' 
          ? 'text-green-400/70' 
          : activity.status === 'skipped'
          ? 'text-red-400/50'
          : 'text-foreground/30'
      }`}>
        [{activity.status}]
      </span>
    </button>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusIcon(status: string): string {
  switch (status) {
    case 'logged':
      return '✓';
    case 'skipped':
      return '⊘';
    case 'target':
      return '○';
    default:
      return '○';
  }
}

function formatProgress(progress?: DomainProgress): string {
  if (!progress) return '';
  
  if (progress.count) {
    return `${progress.count.logged}/${progress.count.target}`;
  }
  
  if (progress.unit === 'min' || progress.unit === 'minutes') {
    return `${progress.logged}/${progress.target}m`;
  }
  
  return `${progress.logged}/${progress.target}${progress.unit ? progress.unit : ''}`;
}

function groupActivitiesByDomain(
  planItems: PlanItem[],
  plannedActivities: PlannedActivity[],
  activityLogs: ActivityLog[]
): Record<Domain, DomainActivity[]> {
  const result: Record<Domain, DomainActivity[]> = {
    heart: [],
    frame: [],
    mind: [],
    metabolism: [],
    recovery: [],
  };

  // Convert PlanItems to DomainActivities (legacy support)
  planItems.forEach(item => {
    const domain = item.domain as Domain;
    if (result[domain]) {
      result[domain].push({
        id: item.id,
        name: item.title,
        dayOfWeek: item.dayOfWeek,
        targetValue: item.durationMinutes || undefined,
        targetUnit: item.durationMinutes ? 'min' : undefined,
        status: item.status === 'done' ? 'logged' : item.status === 'skipped' ? 'skipped' : 'planned',
        details: item.personalizationContext,
      });
    }
  });

  // Convert PlannedActivities to DomainActivities
  plannedActivities.forEach(pa => {
    const domain = pa.domain as Domain;
    if (result[domain]) {
      result[domain].push({
        id: pa.id,
        name: pa.activityDefinitionId, // Would be resolved to name in real implementation
        dayOfWeek: pa.dayOfWeek,
        targetValue: pa.targetValue,
        targetUnit: pa.targetUnit,
        status: pa.status as 'planned' | 'logged' | 'skipped',
        details: pa.details,
      });
    }
  });

  return result;
}

function calculateProgressFromItems(items: PlanItem[]): Record<Domain, DomainProgress> {
  const result: Record<Domain, DomainProgress> = {
    heart: { logged: 0, target: 0, unit: 'min', count: { logged: 0, target: 0 } },
    frame: { logged: 0, target: 0, unit: '', count: { logged: 0, target: 0 } },
    mind: { logged: 0, target: 0, unit: 'min', count: { logged: 0, target: 0 } },
    metabolism: { logged: 0, target: 0, unit: '', count: { logged: 0, target: 0 } },
    recovery: { logged: 0, target: 0, unit: '', count: { logged: 0, target: 0 } },
  };

  items.forEach(item => {
    const domain = item.domain as Domain;
    if (result[domain]) {
      result[domain].count!.target++;
      if (item.status === 'done') {
        result[domain].count!.logged++;
      }
      if (item.durationMinutes) {
        result[domain].target += item.durationMinutes;
        if (item.status === 'done') {
          result[domain].logged += item.durationMinutes;
        }
      }
    }
  });

  return result;
}
