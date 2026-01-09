'use client';

import { SettingsOverlay } from './SettingsOverlay';

interface ProfileButtonProps {
  coachingStyle?: {
    tone: 'supportive' | 'neutral' | 'tough';
    density: 'minimal' | 'balanced' | 'detailed';
    formality: 'casual' | 'professional' | 'clinical';
  };
}

export function ProfileButton({ coachingStyle }: ProfileButtonProps) {
  return (
    <SettingsOverlay
      initialCoachingStyle={coachingStyle}
      trigger={
        <button
          className="
            w-9 h-9 rounded-full 
            bg-white/5 border border-white/10
            flex items-center justify-center
            text-foreground/40 
            hover:bg-white/10 hover:border-white/20
            transition-all duration-300
          "
          aria-label="Open settings"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      }
    />
  );
}
