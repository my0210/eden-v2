'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-9 h-9 rounded-full 
          bg-gradient-to-br from-green-500/20 to-emerald-500/10
          border border-green-500/30
          flex items-center justify-center
          text-green-400 font-medium text-sm
          hover:border-green-400/50
          transition-colors duration-200
        "
        aria-label="Open profile menu"
      >
        E
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="
            absolute top-full left-0 mt-2 z-50
            w-48 py-2
            bg-background-secondary border border-default rounded-xl
            shadow-lg
            animate-fade-in
          ">
            <div className="px-4 py-2 border-b border-muted">
              <p className="text-sm font-medium">Eden</p>
              <p className="text-xs text-foreground-muted">Your AI Coach</p>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to settings
                }}
                className="
                  w-full px-4 py-2 text-left text-sm
                  text-foreground-muted hover:text-foreground
                  hover:bg-background-tertiary
                  transition-colors duration-150
                "
              >
                Settings
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to coaching style
                }}
                className="
                  w-full px-4 py-2 text-left text-sm
                  text-foreground-muted hover:text-foreground
                  hover:bg-background-tertiary
                  transition-colors duration-150
                "
              >
                Coaching Style
              </button>
            </div>

            <div className="pt-1 border-t border-muted">
              <button
                onClick={handleSignOut}
                className="
                  w-full px-4 py-2 text-left text-sm
                  text-red-400 hover:text-red-300
                  hover:bg-background-tertiary
                  transition-colors duration-150
                "
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

