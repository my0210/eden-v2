'use client';

import { useRef } from 'react';
import { UserFeedbackButton, UserFeedbackButtonRef } from './UserFeedbackButton';
import { SettingsOverlay } from './SettingsOverlay';

interface UserFeedbackWrapperProps {
  coachingStyle?: {
    tone: 'supportive' | 'neutral' | 'tough';
    density: 'minimal' | 'balanced' | 'detailed';
    formality: 'casual' | 'professional' | 'clinical';
  };
  isAdmin?: boolean;
}

export function UserFeedbackWrapper({ coachingStyle, isAdmin }: UserFeedbackWrapperProps) {
  const feedbackButtonRef = useRef<UserFeedbackButtonRef>(null);

  const handleOpenFeedback = () => {
    feedbackButtonRef.current?.open();
  };

  return (
    <>
      {/* Profile Button with Settings */}
      <SettingsOverlay
        initialCoachingStyle={coachingStyle}
        isAdmin={isAdmin}
        onOpenFeedback={handleOpenFeedback}
        trigger={
          <button
            className="
              w-9 h-9 rounded-full 
              bg-white/5 border border-white/10
              flex items-center justify-center
              text-foreground/50 
              hover:bg-white/10 hover:border-white/20
              transition-all duration-300
            "
            aria-label="Open settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </button>
        }
      />

      {/* Floating Feedback Button */}
      <div className="fixed bottom-6 left-6 z-40 safe-area-bottom">
        <UserFeedbackButton ref={feedbackButtonRef} />
      </div>
    </>
  );
}
