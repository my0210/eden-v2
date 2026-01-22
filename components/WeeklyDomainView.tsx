'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Domain, 
  DOMAINS, 
  DOMAIN_LABELS, 
  DOMAIN_EMOJI, 
  DOMAIN_COLORS,
  RecommendedActivity,
  ActivityLog
} from '@/lib/types';
import { ActivityLogger } from './ActivityLogger';
import { getActivityById } from '@/lib/ai/activityCatalogue';

// ============================================================================
// Types
// ============================================================================

interface DomainProgress {
  logged: number;
  target: number;
  unit: string;
}

interface WeeklyDomainViewProps {
  // Recommended activities from protocol
  recommendedActivities?: RecommendedActivity[];
  // Logged activities this week
  activityLogs?: ActivityLog[];
}

// ============================================================================
// Main Component
// ============================================================================

export function WeeklyDomainView({
  recommendedActivities = [],
  activityLogs = [],
}: WeeklyDomainViewProps) {
  const router = useRouter();
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [loggerDomain, setLoggerDomain] = useState<Domain | undefined>();

  // Group recommended activities by domain
  const activitiesByDomain = groupByDomain(recommendedActivities);
  
  // Calculate progress for each domain
  const domainProgress = calculateDomainProgress(recommendedActivities, activityLogs);

  const handleAddActivity = useCallback((domain: Domain) => {
    setLoggerDomain(domain);
    setLoggerOpen(true);
  }, []);

  const handleLogActivity = useCallback(async (data: {
    activityId: string;
    domain: Domain;
    date: string;
    value: number;
    unit: string;
    notes?: string;
  }) => {
    try {
      const response = await fetch('/api/activities/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
    
    setLoggerOpen(false);
    setLoggerDomain(undefined);
  }, [router]);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-foreground/40 uppercase tracking-wider">
        This Week
      </h2>

      <div className="space-y-3">
        {DOMAINS.map(domain => (
          <DomainCard
            key={domain}
            domain={domain}
            activities={activitiesByDomain[domain] || []}
            progress={domainProgress[domain]}
            logs={activityLogs.filter(log => log.domain === domain)}
            onAddActivity={handleAddActivity}
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
// Domain Card
// ============================================================================

interface DomainCardProps {
  domain: Domain;
  activities: RecommendedActivity[];
  progress: DomainProgress;
  logs: ActivityLog[];
  onAddActivity: (domain: Domain) => void;
}

function DomainCard({ 
  domain, 
  activities, 
  progress,
  logs,
  onAddActivity 
}: DomainCardProps) {
  const emoji = DOMAIN_EMOJI[domain];
  const label = DOMAIN_LABELS[domain];
  const color = DOMAIN_COLORS[domain];
  
  const progressPercent = progress.target > 0 
    ? Math.min((progress.logged / progress.target) * 100, 100)
    : 0;

  // Format progress text
  const progressText = progress.target > 0
    ? `${progress.logged}/${progress.target} ${progress.unit}`
    : '';

  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{ 
        backgroundColor: `${color}08`,
        borderLeft: `3px solid ${color}40`,
      }}
    >
      {/* Header with Progress */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-medium text-foreground/80">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          {progressText && (
            <span className="text-sm font-mono" style={{ color }}>
              {progressText}
            </span>
          )}
          <button
            onClick={() => onAddActivity(domain)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {progress.target > 0 && (
        <div className="px-4 pb-3">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progressPercent}%`, 
                backgroundColor: color 
              }}
            />
          </div>
        </div>
      )}

      {/* Recommended Activities */}
      {activities.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          {activities.map(activity => {
            const catalogueActivity = getActivityById(activity.activityId);
            const name = catalogueActivity?.name || activity.activityId;
            
            return (
              <div 
                key={activity.activityId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground/50">{name}</span>
                <span className="text-foreground/30">{activity.weeklyTarget}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-white/5 pt-3">
          <span className="text-xs text-foreground/30 uppercase tracking-wider">Logged</span>
          {logs.slice(0, 3).map(log => {
            const catalogueActivity = getActivityById(log.activityDefinitionId);
            const name = catalogueActivity?.name || log.activityDefinitionId;
            
            return (
              <div 
                key={log.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-foreground/60">{name}</span>
                </div>
                <span className="text-foreground/40">
                  {log.value} {log.unit}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {activities.length === 0 && logs.length === 0 && (
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground/30">No activities yet</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function groupByDomain(activities: RecommendedActivity[]): Record<Domain, RecommendedActivity[]> {
  const result: Record<Domain, RecommendedActivity[]> = {
    heart: [],
    frame: [],
    mind: [],
    metabolism: [],
    recovery: [],
  };
  
  for (const activity of activities) {
    if (activity.domain in result) {
      result[activity.domain].push(activity);
    }
  }
  
  return result;
}

function calculateDomainProgress(
  activities: RecommendedActivity[],
  logs: ActivityLog[]
): Record<Domain, DomainProgress> {
  const result: Record<Domain, DomainProgress> = {
    heart: { logged: 0, target: 0, unit: 'min' },
    frame: { logged: 0, target: 0, unit: 'sessions' },
    mind: { logged: 0, target: 0, unit: 'min' },
    metabolism: { logged: 0, target: 0, unit: 'days' },
    recovery: { logged: 0, target: 0, unit: 'hrs' },
  };

  // Set targets from recommended activities
  for (const activity of activities) {
    if (activity.domain in result) {
      result[activity.domain].target += activity.targetValue;
      result[activity.domain].unit = activity.targetUnit;
    }
  }

  // Sum up logged values
  for (const log of logs) {
    if (log.domain in result) {
      result[log.domain].logged += log.value;
    }
  }

  return result;
}
