'use client';

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { UserFeedbackForm } from './UserFeedbackForm';

export interface UserFeedbackButtonRef {
  open: () => void;
  close: () => void;
}

export const UserFeedbackButton = forwardRef<UserFeedbackButtonRef>(
  function UserFeedbackButton(_, ref) {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Expose open/close methods to parent via ref
    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }));

    // Handle animation states
    useEffect(() => {
      if (isOpen) {
        // Small delay to trigger animation
        requestAnimationFrame(() => setIsVisible(true));
      } else {
        setIsVisible(false);
      }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          isOpen &&
          popoverRef.current &&
          buttonRef.current &&
          !popoverRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleSuccess = () => {
      // Close after a brief delay to show success state
      setTimeout(() => setIsOpen(false), 1500);
    };

    return (
      <div className="relative">
        {/* Popover - opens above and to the right on mobile-friendly left position */}
        {isOpen && (
          <div
            ref={popoverRef}
            className="absolute bottom-full left-0 mb-3"
            style={{
              transformOrigin: 'bottom left',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'scale(1)' : 'scale(0.93)',
              transition: 'opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <UserFeedbackForm 
              onSuccess={handleSuccess} 
              onClose={() => setIsOpen(false)} 
            />
          </div>
        )}

        {/* Floating Button */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 active:scale-[0.97]"
          style={{
            backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          aria-label={isOpen ? 'Close feedback' : 'Send feedback'}
        >
          {isOpen ? (
            // X icon when open
            <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Feedback icon when closed
            <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          )}
        </button>
      </div>
    );
  }
);
