'use client';

import { useState } from 'react';
import { SettingsOverlay } from './SettingsOverlay';

// Menu/hamburger icon
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" 
      />
    </svg>
  );
}

interface SettingsButtonProps {
  isAdmin?: boolean;
}

export function SettingsButton({ isAdmin }: SettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="
          w-9 h-9 rounded-full
          flex items-center justify-center
          text-foreground/40
          hover:text-foreground/60 hover:bg-white/5
          active:scale-95
          transition-all duration-200
        "
        aria-label="Open settings"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      <SettingsOverlay 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        isAdmin={isAdmin}
      />
    </>
  );
}
