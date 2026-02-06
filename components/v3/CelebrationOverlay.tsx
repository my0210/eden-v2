'use client';

import { useEffect, useState } from 'react';
import { PILLARS, PILLAR_CONFIGS } from '@/lib/v3/coreFive';

interface CelebrationOverlayProps {
  type: 'all_five' | 'milestone';
  streak?: number;
  milestoneText?: string;
  onDismiss: () => void;
}

// Milestone definitions
export interface Milestone {
  id: string;
  streakThreshold: number;
  text: string;
  subtext: string;
}

export const MILESTONES: Milestone[] = [
  { id: 'first_five', streakThreshold: 1, text: 'First full week.', subtext: 'Every journey starts with one.' },
  { id: 'streak_2', streakThreshold: 2, text: 'Two weeks strong.', subtext: 'Consistency is forming.' },
  { id: 'streak_4', streakThreshold: 4, text: 'One month in your prime.', subtext: 'This is becoming a practice.' },
  { id: 'streak_8', streakThreshold: 8, text: 'Two months.', subtext: 'This is who you are now.' },
  { id: 'streak_12', streakThreshold: 12, text: 'Twelve weeks.', subtext: "You've built a practice." },
];

export function getSeenMilestones(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('huuman_milestones_seen');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function markMilestoneSeen(id: string) {
  if (typeof window === 'undefined') return;
  const seen = getSeenMilestones();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem('huuman_milestones_seen', JSON.stringify(seen));
  }
}

export function getUnseenMilestone(streak: number): Milestone | null {
  const seen = getSeenMilestones();
  // Find the highest milestone that the streak qualifies for and hasn't been seen
  const eligible = MILESTONES
    .filter(m => streak >= m.streakThreshold && !seen.includes(m.id))
    .sort((a, b) => b.streakThreshold - a.streakThreshold);
  return eligible[0] || null;
}

const PARTICLE_COLORS = PILLARS.map(p => PILLAR_CONFIGS[p].color);

export function CelebrationOverlay({ type, streak, milestoneText, onDismiss }: CelebrationOverlayProps) {
  const [dismissing, setDismissing] = useState(false);

  // Auto-dismiss after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissing(true);
    setTimeout(onDismiss, 300);
  };

  const isMilestone = type === 'milestone' && milestoneText;

  return (
    <div 
      className={`fixed inset-0 z-[200] flex items-center justify-center ${dismissing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      onClick={handleDismiss}
    >
      {/* Particle burst */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {PARTICLE_COLORS.map((color, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 rounded-full particle-${i}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-8 animate-celebration-text">
        {isMilestone ? (
          <>
            {/* Milestone celebration */}
            <div className="mb-3">
              <span className="text-3xl">🔥</span>
            </div>
            <h2 className="text-3xl font-light tracking-tight text-white mb-2">
              {milestoneText}
            </h2>
            {streak && streak > 0 && (
              <p className="text-lg text-green-400/80 font-medium tabular-nums">
                Week {streak}
              </p>
            )}
          </>
        ) : (
          <>
            {/* Standard 5/5 celebration */}
            <h2 className="text-3xl font-light tracking-tight text-white mb-3">
              You&apos;re in your prime.
            </h2>
            <div className="flex items-center justify-center gap-2">
              {streak && streak > 0 && (
                <p className="text-lg text-green-400/70 font-medium tabular-nums">
                  <span className="mr-1">🔥</span> Week {streak}
                </p>
              )}
            </div>
            {/* Five pillar dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {PILLARS.map(pillar => (
                <div
                  key={pillar}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PILLAR_CONFIGS[pillar].color }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
