'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Need to track when component is mounted for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen]);

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

  const menuContent = isOpen && mounted ? (
    <>
      {/* Full screen backdrop */}
      <div 
        className="fixed inset-0"
        style={{ zIndex: 99998 }}
        onClick={() => setIsOpen(false)}
      />

      {/* Menu */}
      <div 
        className="fixed w-48 py-2 border border-white/10 rounded-xl shadow-2xl animate-fade-in"
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          zIndex: 99999,
          backgroundColor: '#0a0a0a',
        }}
      >
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-sm text-foreground/80">Eden</p>
          <p className="text-xs text-foreground/40">Your coach</p>
        </div>

        <div className="py-1">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2.5 text-left text-sm text-foreground/50 hover:text-foreground/80 hover:bg-white/5 transition-colors"
          >
            Settings
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2.5 text-left text-sm text-foreground/50 hover:text-foreground/80 hover:bg-white/5 transition-colors"
          >
            Coaching Style
          </button>
        </div>

        {/* Dev Tools */}
        <div className="py-1 border-t border-white/10">
          <p className="px-4 py-1 text-xs text-foreground/30">Dev</p>
          <button
            onClick={handleReset}
            disabled={loading !== null}
            className="w-full px-4 py-2.5 text-left text-sm text-yellow-400/70 hover:text-yellow-400 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {loading === 'reset' ? 'Resetting...' : '↺ Reset Data'}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading !== null}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {loading === 'delete' ? 'Deleting...' : '✕ Delete Account'}
          </button>
        </div>

        <div className="pt-1 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-left text-sm text-foreground/40 hover:text-foreground/60 hover:bg-white/5 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-9 h-9 rounded-full 
          bg-white/5 border border-white/10
          flex items-center justify-center
          text-foreground/40 
          hover:bg-white/10 hover:border-white/20
          transition-all duration-300
        "
        aria-label="Open menu"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Portal menu to document.body to escape all stacking contexts */}
      {mounted && menuContent && createPortal(menuContent, document.body)}
    </>
  );
}
