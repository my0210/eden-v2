'use client';

import { useEffect, useRef, useState } from 'react';
import { YouView } from './YouView';

interface YouOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YouOverlay({ isOpen, onClose }: YouOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle animation state
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchCurrent(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchCurrent(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchCurrent === null) return;
    
    const diff = touchCurrent - touchStart;
    const threshold = 100; // pixels to trigger close
    
    if (diff > threshold) {
      onClose();
    }
    
    setTouchStart(null);
    setTouchCurrent(null);
  };

  // Calculate swipe offset for visual feedback
  const swipeOffset = touchStart !== null && touchCurrent !== null 
    ? Math.max(0, touchCurrent - touchStart) 
    : 0;

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Full screen overlay - like Instagram camera (no backdrop, full takeover) */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] transition-transform duration-300 ease-out"
        style={{
          backgroundColor: '#0a0a0a',
          transform: isOpen 
            ? `translateX(${swipeOffset}px)` 
            : 'translateX(100%)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false);
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/5" style={{ backgroundColor: '#0a0a0a' }}>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-lg font-medium text-foreground/80">You</span>
            <button
              onClick={onClose}
              className="
                w-9 h-9 rounded-full
                flex items-center justify-center
                text-foreground/40
                hover:text-foreground/60 hover:bg-white/5
                active:scale-95
                transition-all duration-200
              "
              aria-label="Close"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-65px)] overflow-y-auto">
          <YouView />
        </div>
      </div>
    </>
  );
}
