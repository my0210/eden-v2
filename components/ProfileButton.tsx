'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleReset = async () => {
    if (!confirm('Reset all data? You will go through onboarding again.')) return;
    
    setLoading('reset');
    try {
      const res = await fetch('/api/dev/reset', { method: 'POST' });
      if (res.ok) {
        setIsOpen(false);
        router.push('/onboarding');
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    
    setLoading('delete');
    try {
      const res = await fetch('/api/dev/delete', { method: 'POST' });
      if (res.ok) {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
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

            {/* Dev Tools */}
            <div className="py-1 border-t border-muted">
              <p className="px-4 py-1 text-xs text-foreground-subtle">Dev</p>
              <button
                onClick={handleReset}
                disabled={loading !== null}
                className="
                  w-full px-4 py-2 text-left text-sm
                  text-yellow-400 hover:text-yellow-300
                  hover:bg-background-tertiary
                  transition-colors duration-150
                  disabled:opacity-50
                "
              >
                {loading === 'reset' ? 'Resetting...' : '↺ Reset Data'}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading !== null}
                className="
                  w-full px-4 py-2 text-left text-sm
                  text-red-400 hover:text-red-300
                  hover:bg-background-tertiary
                  transition-colors duration-150
                  disabled:opacity-50
                "
              >
                {loading === 'delete' ? 'Deleting...' : '✕ Delete Account'}
              </button>
            </div>

            <div className="pt-1 border-t border-muted">
              <button
                onClick={handleSignOut}
                className="
                  w-full px-4 py-2 text-left text-sm
                  text-foreground-muted hover:text-foreground
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
