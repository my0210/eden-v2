'use client';

import { useState } from 'react';
import { 
  Protocol, 
  ProtocolWeek, 
  RecommendedActivity,
  Domain, 
  DOMAINS,
  DOMAIN_COLORS, 
  DOMAIN_LABELS,
  DOMAIN_EMOJI 
} from '@/lib/types';
import { getActivityById } from '@/lib/ai/activityCatalogue';

// ============================================================================
// Types
// ============================================================================

interface ProtocolViewProps {
  protocol: Protocol;
  currentWeekNumber: number;
  domainProgress?: Record<Domain, { logged: number; target: number; unit: string }>;
}

// ============================================================================
// Main Component
// ============================================================================

export function ProtocolView({ 
  protocol, 
  currentWeekNumber, 
  domainProgress 
}: ProtocolViewProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const selectedWeekData = selectedWeek !== null 
    ? protocol.weeks.find(w => w.weekNumber === selectedWeek) 
    : null;

  // Group recommended activities by domain
  const activitiesByDomain = groupActivitiesByDomain(protocol.recommendedActivities || []);

  return (
    <div className="space-y-8 pb-8">
      {/* Goal Summary */}
      <section className="px-6">
        <div className="space-y-1">
          <h2 className="text-xs text-foreground/40 uppercase tracking-wider">Your Goal</h2>
          <p className="text-lg text-foreground/80 font-light leading-relaxed">
            "{protocol.goalSummary}"
          </p>
        </div>
      </section>

      {/* Strategic Narrative */}
      {protocol.narrative && (
        <section className="px-6">
          <NarrativeSection narrative={protocol.narrative} />
        </section>
      )}

      {/* Recommended Activities by Domain */}
      <section className="px-6 space-y-4">
        <h2 className="text-xs text-foreground/40 uppercase tracking-wider">
          Recommended Activities
        </h2>

        <div className="space-y-3">
          {DOMAINS.map(domain => {
            const activities = activitiesByDomain[domain] || [];
            if (activities.length === 0) return null;
            
            return (
              <DomainActivities
                key={domain}
                domain={domain}
                activities={activities}
                progress={domainProgress?.[domain]}
              />
            );
          })}
        </div>
      </section>

      {/* 12-Week Overview */}
      <section className="px-6 space-y-4">
        <h2 className="text-xs text-foreground/40 uppercase tracking-wider">
          12-Week Journey
        </h2>
        
        <WeekGrid 
          weeks={protocol.weeks}
          currentWeekNumber={currentWeekNumber}
          selectedWeek={selectedWeek}
          onSelectWeek={setSelectedWeek}
        />

        {/* Selected Week Detail */}
        {selectedWeekData && (
          <WeekDetail 
            week={selectedWeekData} 
            currentWeekNumber={currentWeekNumber}
            onClose={() => setSelectedWeek(null)}
          />
        )}
      </section>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function groupActivitiesByDomain(activities: RecommendedActivity[]): Record<Domain, RecommendedActivity[]> {
  const grouped: Record<Domain, RecommendedActivity[]> = {
    heart: [],
    frame: [],
    mind: [],
    metabolism: [],
    recovery: [],
  };
  
  for (const activity of activities) {
    if (activity.domain in grouped) {
      grouped[activity.domain].push(activity);
    }
  }
  
  return grouped;
}

// ============================================================================
// Narrative Section
// ============================================================================

interface NarrativeSectionProps {
  narrative: Protocol['narrative'];
}

function NarrativeSection({ narrative }: NarrativeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="rounded-xl p-4 space-y-3"
      style={{ 
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        borderColor: 'rgba(34, 197, 94, 0.15)',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-medium text-green-400/80">Why This Protocol</h3>
          <p className="text-sm text-foreground/60 leading-relaxed">
            {narrative.why}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-foreground/30 hover:text-foreground/50 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-green-500/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <h4 className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-1">Approach</h4>
            <p className="text-sm text-foreground/60">{narrative.approach}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-1">Week 12 Outcomes</h4>
            <p className="text-sm text-foreground/60">{narrative.expectedOutcomes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Domain Activities Section
// ============================================================================

interface DomainActivitiesProps {
  domain: Domain;
  activities: RecommendedActivity[];
  progress?: { logged: number; target: number; unit: string };
}

function DomainActivities({ domain, activities, progress }: DomainActivitiesProps) {
  const emoji = DOMAIN_EMOJI[domain];
  const label = DOMAIN_LABELS[domain];
  const color = DOMAIN_COLORS[domain];

  return (
    <div 
      className="rounded-xl p-4 space-y-3"
      style={{ 
        backgroundColor: `${color}08`,
        borderLeft: `3px solid ${color}40`,
      }}
    >
      {/* Domain Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-medium text-foreground/80">{label}</span>
        </div>
        {progress && (
          <span className="text-sm" style={{ color }}>
            {progress.logged}/{progress.target} {progress.unit}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {progress && progress.target > 0 && (
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min((progress.logged / progress.target) * 100, 100)}%`, 
              backgroundColor: color 
            }}
          />
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-2">
        {activities.map(activity => (
          <ActivityCard key={activity.activityId} activity={activity} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Activity Card
// ============================================================================

interface ActivityCardProps {
  activity: RecommendedActivity;
}

function ActivityCard({ activity }: ActivityCardProps) {
  const catalogueActivity = getActivityById(activity.activityId);
  const name = catalogueActivity?.name || activity.activityId;

  return (
    <div className="bg-white/[0.03] rounded-lg p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/70">{name}</span>
        <span className="text-xs text-foreground/40">{activity.weeklyTarget}</span>
      </div>
      <p className="text-xs text-foreground/50 leading-relaxed">
        {activity.personalization}
      </p>
    </div>
  );
}

// ============================================================================
// Week Grid
// ============================================================================

interface WeekGridProps {
  weeks: ProtocolWeek[];
  currentWeekNumber: number;
  selectedWeek: number | null;
  onSelectWeek: (week: number | null) => void;
}

function WeekGrid({ weeks, currentWeekNumber, selectedWeek, onSelectWeek }: WeekGridProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {weeks.map((week) => {
        const isCurrent = week.weekNumber === currentWeekNumber;
        const isPast = week.weekNumber < currentWeekNumber;
        const isSelected = selectedWeek === week.weekNumber;
        const isDeload = week.theme?.toLowerCase().includes('deload');

        return (
          <button
            key={week.weekNumber}
            onClick={() => onSelectWeek(isSelected ? null : week.weekNumber)}
            className={`
              relative p-2 rounded-lg transition-all duration-200
              ${isSelected 
                ? 'bg-white/15 ring-1 ring-white/30' 
                : isCurrent 
                  ? 'bg-green-500/10 ring-1 ring-green-500/30'
                  : isDeload
                    ? 'bg-blue-500/10 hover:bg-blue-500/15'
                    : 'bg-white/[0.03] hover:bg-white/[0.06]'
              }
            `}
          >
            <div className={`
              text-sm font-light tabular-nums text-center
              ${isCurrent ? 'text-green-400' : isPast ? 'text-foreground/60' : 'text-foreground/40'}
            `}>
              {week.weekNumber}
            </div>

            {/* Current indicator */}
            {isCurrent && (
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Week Detail
// ============================================================================

interface WeekDetailProps {
  week: ProtocolWeek;
  currentWeekNumber: number;
  onClose: () => void;
}

function WeekDetail({ week, currentWeekNumber, onClose }: WeekDetailProps) {
  const isFuture = week.weekNumber > currentWeekNumber;
  const isDeload = week.theme?.toLowerCase().includes('deload');

  return (
    <div 
      className="rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ 
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-foreground/80">
            Week {week.weekNumber}
            {isDeload && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                Deload
              </span>
            )}
          </h3>
          {week.theme && (
            <p className="text-sm text-foreground/50">{week.theme}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-foreground/30 hover:text-foreground/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Future week notice */}
      {isFuture && (
        <p className="text-xs text-foreground/40 italic">
          Log activities when this week begins.
        </p>
      )}
    </div>
  );
}
