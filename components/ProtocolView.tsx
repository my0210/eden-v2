'use client';

import { useState } from 'react';
import { 
  Protocol, 
  ProtocolWeek, 
  ProtocolPhase,
  ActiveProtocol,
  Domain, 
  DOMAIN_COLORS, 
  DOMAIN_LABELS,
  DOMAIN_EMOJI 
} from '@/lib/types';
import { getActivityById, getTierLabel } from '@/lib/ai/activityCatalogue';

// ============================================================================
// Types
// ============================================================================

interface ProtocolViewProps {
  protocol: Protocol;
  currentWeekNumber: number;
  weeklyProgress?: Record<number, { total: number; completed: number }>;
  domainProgress?: Record<Domain, { logged: number; target: number; unit: string }>;
}

// ============================================================================
// Main Component
// ============================================================================

export function ProtocolView({ 
  protocol, 
  currentWeekNumber, 
  weeklyProgress = {},
  domainProgress 
}: ProtocolViewProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [expandedTier, setExpandedTier] = useState<0 | 1 | 2 | null>(0);

  const selectedWeekData = selectedWeek !== null 
    ? protocol.weeks.find(w => w.weekNumber === selectedWeek) 
    : null;

  // Get current phase if available
  const currentPhase = protocol.phases?.find(p => 
    currentWeekNumber >= p.weeks[0] && currentWeekNumber <= p.weeks[1]
  );

  // Group active protocols by tier
  const tier0Protocols = protocol.activeProtocols?.filter(p => p.tier === 0) || [];
  const tier1Protocols = protocol.activeProtocols?.filter(p => p.tier === 1) || [];
  const tier2Protocols = protocol.activeProtocols?.filter(p => p.tier === 2 && (!p.unlocksAtWeek || p.unlocksAtWeek <= currentWeekNumber)) || [];
  const lockedProtocols = protocol.activeProtocols?.filter(p => p.unlocksAtWeek && p.unlocksAtWeek > currentWeekNumber) || [];

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

      {/* Phase Timeline */}
      {protocol.phases && protocol.phases.length > 0 && (
        <section className="px-6">
          <PhaseTimeline 
            phases={protocol.phases} 
            currentWeekNumber={currentWeekNumber}
          />
        </section>
      )}

      {/* Active Protocols */}
      <section className="px-6 space-y-4">
        <h2 className="text-xs text-foreground/40 uppercase tracking-wider">
          Your Active Protocols
        </h2>

        {/* Tier 0 - Non-negotiables */}
        {tier0Protocols.length > 0 && (
          <TierSection
            tier={0}
            protocols={tier0Protocols}
            domainProgress={domainProgress}
            isExpanded={expandedTier === 0}
            onToggle={() => setExpandedTier(expandedTier === 0 ? null : 0)}
          />
        )}

        {/* Tier 1 - High ROI */}
        {tier1Protocols.length > 0 && (
          <TierSection
            tier={1}
            protocols={tier1Protocols}
            domainProgress={domainProgress}
            isExpanded={expandedTier === 1}
            onToggle={() => setExpandedTier(expandedTier === 1 ? null : 1)}
          />
        )}

        {/* Tier 2 - Situational */}
        {tier2Protocols.length > 0 && (
          <TierSection
            tier={2}
            protocols={tier2Protocols}
            domainProgress={domainProgress}
            isExpanded={expandedTier === 2}
            onToggle={() => setExpandedTier(expandedTier === 2 ? null : 2)}
          />
        )}

        {/* Coming Later */}
        {lockedProtocols.length > 0 && (
          <LockedProtocolsSection protocols={lockedProtocols} />
        )}
      </section>

      {/* 12-Week Overview */}
      <section className="px-6 space-y-4">
        <h2 className="text-xs text-foreground/40 uppercase tracking-wider">
          12-Week Journey
        </h2>
        
        <WeekGrid 
          weeks={protocol.weeks}
          currentWeekNumber={currentWeekNumber}
          weeklyProgress={weeklyProgress}
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
// Phase Timeline
// ============================================================================

interface PhaseTimelineProps {
  phases: ProtocolPhase[];
  currentWeekNumber: number;
}

function PhaseTimeline({ phases, currentWeekNumber }: PhaseTimelineProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs text-foreground/40 uppercase tracking-wider">12-Week Journey</h2>
      
      <div className="flex gap-2">
        {phases.map((phase, index) => {
          const isActive = currentWeekNumber >= phase.weeks[0] && currentWeekNumber <= phase.weeks[1];
          const isPast = currentWeekNumber > phase.weeks[1];
          const weeksInPhase = phase.weeks[1] - phase.weeks[0] + 1;
          const currentWeekInPhase = isActive ? currentWeekNumber - phase.weeks[0] + 1 : 0;
          const progressPercent = isPast ? 100 : isActive ? (currentWeekInPhase / weeksInPhase) * 100 : 0;

          return (
            <div 
              key={phase.name}
              className={`flex-1 rounded-xl p-3 transition-all ${
                isActive 
                  ? 'bg-green-500/10 ring-1 ring-green-500/30' 
                  : 'bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isActive ? 'text-green-400' : 'text-foreground/50'}`}>
                  {phase.name}
                </span>
                {index < phases.length - 1 && (
                  <span className="text-foreground/20">→</span>
                )}
              </div>
              <p className="text-xs text-foreground/40 mb-2">
                Weeks {phase.weeks[0]}-{phase.weeks[1]}
              </p>
              
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-green-500/50 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {isActive && (
                <p className="text-xs text-foreground/40 mt-2 italic">{phase.focus}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Tier Section
// ============================================================================

interface TierSectionProps {
  tier: 0 | 1 | 2;
  protocols: ActiveProtocol[];
  domainProgress?: Record<Domain, { logged: number; target: number; unit: string }>;
  isExpanded: boolean;
  onToggle: () => void;
}

function TierSection({ tier, protocols, domainProgress, isExpanded, onToggle }: TierSectionProps) {
  const tierLabel = getTierLabel(tier);
  const tierDescriptions: Record<number, string> = {
    0: 'Non-negotiables',
    1: 'High ROI',
    2: 'Situational',
  };

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      {/* Tier Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            tier === 0 ? 'bg-green-500/20 text-green-400' :
            tier === 1 ? 'bg-blue-500/20 text-blue-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            T{tier}
          </span>
          <span className="text-sm text-foreground/60">
            {tierLabel} · {tierDescriptions[tier]}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-foreground/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Protocol Cards */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {protocols.map(protocol => (
            <ActiveProtocolCard 
              key={protocol.activityId}
              protocol={protocol}
              progress={domainProgress?.[protocol.domain]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Active Protocol Card
// ============================================================================

interface ActiveProtocolCardProps {
  protocol: ActiveProtocol;
  progress?: { logged: number; target: number; unit: string };
}

function ActiveProtocolCard({ protocol, progress }: ActiveProtocolCardProps) {
  const activity = getActivityById(protocol.activityId);
  const activityName = activity?.name || protocol.activityId;
  const emoji = DOMAIN_EMOJI[protocol.domain];
  const color = DOMAIN_COLORS[protocol.domain];

  const progressPercent = progress 
    ? Math.min((progress.logged / progress.target) * 100, 100)
    : 0;

  return (
    <div 
      className="rounded-lg p-3 space-y-2"
      style={{ 
        backgroundColor: `${color}08`,
        borderLeft: `3px solid ${color}40`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-medium text-foreground/80">{activityName}</span>
        </div>
        <span className="text-xs text-foreground/40">{protocol.weeklyTarget}</span>
      </div>

      {/* Personalization */}
      <p className="text-xs text-foreground/50 leading-relaxed">
        {protocol.personalization}
      </p>

      {/* Progress */}
      {progress && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/40">This week</span>
            <span style={{ color }}>
              {progress.logged}/{progress.target}{progress.unit}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, backgroundColor: color }}
            />
          </div>
        </div>
      )}

      {/* Variants */}
      {protocol.variants && protocol.variants.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {protocol.variants.map(v => (
            <span 
              key={v}
              className="text-xs px-2 py-0.5 rounded bg-white/5 text-foreground/40"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Locked Protocols Section
// ============================================================================

interface LockedProtocolsSectionProps {
  protocols: ActiveProtocol[];
}

function LockedProtocolsSection({ protocols }: LockedProtocolsSectionProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3">
        <span className="text-sm text-foreground/40">Coming Later</span>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {protocols.map(protocol => {
          const activity = getActivityById(protocol.activityId);
          const activityName = activity?.name || protocol.activityId;
          
          return (
            <div 
              key={protocol.activityId}
              className="flex items-center justify-between py-2 opacity-50"
            >
              <span className="text-sm text-foreground/50">{activityName}</span>
              <span className="text-xs text-foreground/30">Unlocks Week {protocol.unlocksAtWeek}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Week Grid
// ============================================================================

interface WeekGridProps {
  weeks: ProtocolWeek[];
  currentWeekNumber: number;
  weeklyProgress: Record<number, { total: number; completed: number }>;
  selectedWeek: number | null;
  onSelectWeek: (week: number | null) => void;
}

function WeekGrid({ weeks, currentWeekNumber, weeklyProgress, selectedWeek, onSelectWeek }: WeekGridProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {weeks.map((week) => {
        const progress = weeklyProgress[week.weekNumber] || { total: 0, completed: 0 };
        const isCurrent = week.weekNumber === currentWeekNumber;
        const isPast = week.weekNumber < currentWeekNumber;
        const isSelected = selectedWeek === week.weekNumber;
        const percentage = progress.total > 0 
          ? Math.round((progress.completed / progress.total) * 100) 
          : 0;

        // Intensity color
        const intensityColor = week.intensityLevel === 'deload' 
          ? 'bg-blue-500/20' 
          : week.intensityLevel === 'high'
          ? 'bg-red-500/20'
          : '';

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
                  : `bg-white/[0.03] hover:bg-white/[0.06] ${intensityColor}`
              }
            `}
          >
            <div className={`
              text-sm font-light tabular-nums text-center
              ${isCurrent ? 'text-green-400' : isPast ? 'text-foreground/60' : 'text-foreground/40'}
            `}>
              {week.weekNumber}
            </div>

            {/* Progress dot */}
            {(isPast || isCurrent) && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                <div 
                  className={`w-1 h-1 rounded-full ${
                    percentage === 100 ? 'bg-green-400' : 
                    percentage > 0 ? 'bg-white/40' : 'bg-white/10'
                  }`}
                />
              </div>
            )}

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
            {week.intensityLevel === 'deload' && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                Deload
              </span>
            )}
          </h3>
          <p className="text-sm text-foreground/50">{week.theme || week.focus}</p>
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

      {/* Progression Notes */}
      {week.progressionNotes && (
        <p className="text-sm text-foreground/60 italic">
          {week.progressionNotes}
        </p>
      )}

      {/* Domain Emphasis */}
      {week.domainEmphasis && week.domainEmphasis.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {week.domainEmphasis.map(domain => (
            <span 
              key={domain}
              className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
              style={{ backgroundColor: `${DOMAIN_COLORS[domain]}15`, color: DOMAIN_COLORS[domain] }}
            >
              {DOMAIN_EMOJI[domain]} {DOMAIN_LABELS[domain]}
            </span>
          ))}
        </div>
      )}

      {/* Legacy domain focuses */}
      {week.domains && Object.keys(week.domains).length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          {Object.entries(week.domains).map(([domain, focus]) => (
            <div key={domain} className="flex items-start gap-2 text-sm">
              <div 
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: DOMAIN_COLORS[domain as Domain] }}
              />
              <div>
                <span className="text-foreground/50">{DOMAIN_LABELS[domain as Domain]}:</span>{' '}
                <span className="text-foreground/70">{focus}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Future week notice */}
      {isFuture && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-xs text-foreground/40 italic">
            Activities will be scheduled when this week begins.
          </p>
        </div>
      )}
    </div>
  );
}
