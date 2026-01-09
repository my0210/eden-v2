'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function DevTools({ userId }: { userId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleReset = async () => {
    if (!confirm('Reset all data? You will go through onboarding again.')) return;
    
    setLoading('reset');
    try {
      const res = await fetch('/api/dev/reset', { method: 'POST' });
      if (res.ok) {
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
    <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-50">
      <button
        onClick={handleReset}
        disabled={loading !== null}
        className="px-3 py-1.5 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 disabled:opacity-50"
      >
        {loading === 'reset' ? '...' : '↺ Reset'}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
      >
        {loading === 'delete' ? '...' : '✕ Delete'}
      </button>
    </div>
  );
}

