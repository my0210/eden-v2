'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center animate-fade-in-up">
        <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-foreground/60 mb-2">Check your email</p>
        <p className="text-foreground/40 text-sm mb-8">{email}</p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
        >
          Use different email
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <form onSubmit={handleMagicLink} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400/80 text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full px-4 py-4 
              bg-white/5 
              border border-white/10 
              rounded-xl
              text-foreground text-center
              placeholder:text-foreground/30
              focus:outline-none focus:border-white/20
              transition-colors
            "
            placeholder="your@email.com"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full px-6 py-4 rounded-xl
            bg-white/10 
            border border-white/10
            text-foreground/80 font-medium
            hover:bg-white/15 hover:border-white/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
          "
        >
          {loading ? 'Sending...' : 'Continue'}
        </button>
      </form>

      <p className="mt-8 text-center text-foreground/30 text-xs">
        We&apos;ll send you a magic link
      </p>
    </div>
  );
}
