'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DOMAINS } from '@/lib/types';
import { DomainCard } from '@/components/metrics/DomainCard';

interface YouOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YouOverlay({ isOpen, onClose }: YouOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready before animation starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle swipe to close
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    // Only allow swiping right (positive diff)
    if (diff > 0) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    const diff = touchCurrentX.current - touchStartX.current;
    if (diff > 100) {
      // Swipe threshold met, close
      onClose();
    }
    setSwipeOffset(0);
  };

  if (!mounted || !shouldRender) return null;

  const overlayContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0"
      style={{
        zIndex: 9999,
        backgroundColor: '#0a0a0a',
        transform: isAnimating 
          ? `translateX(${swipeOffset}px)` 
          : 'translateX(100%)',
        transition: swipeOffset > 0 ? 'none' : 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-white/5"
        style={{ backgroundColor: '#0a0a0a' }}
      >
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
      </header>

      {/* Content */}
      <div className="px-6 py-4 space-y-3 overflow-y-auto" style={{ height: 'calc(100vh - 65px)' }}>
        {DOMAINS.map((domain) => (
          <DomainCard key={domain} domain={domain} />
        ))}
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
