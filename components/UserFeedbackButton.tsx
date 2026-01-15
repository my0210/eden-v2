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
      <div className="fixed bottom-6 right-6 z-50">
        {/* Popover */}
        {isOpen && (
          <div
            ref={popoverRef}
            className="absolute bottom-full right-0 mb-3"
            style={{
              transformOrigin: 'bottom right',
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
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 active:scale-[0.97]"
          style={{
            backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          aria-label={isOpen ? 'Close feedback' : 'Send feedback'}
        >
          {isOpen ? (
            // X icon when open
            <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Message icon when closed
            <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>
    );
  }
);
