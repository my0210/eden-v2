'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Focus code input when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      codeInputRef.current?.focus();
    }
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setStep('otp');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'email',
      });

      if (error) {
        setError('Invalid code. Please try again.');
        setCode('');
        codeInputRef.current?.focus();
        return;
      }

      router.push('/week');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-foreground/60 mb-1">Enter the code sent to</p>
          <p className="text-foreground/80 text-sm">{email}</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400/80 text-sm text-center mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4 mb-8">
          {/* Single code input - easy to paste */}
          <input
            ref={codeInputRef}
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            disabled={loading}
            placeholder="Paste code here"
            className="
              w-full px-4 py-4
              bg-white/5 
              border border-white/10 
              rounded-xl
              text-foreground text-center text-2xl font-medium tracking-[0.3em]
              placeholder:text-foreground/20 placeholder:text-base placeholder:tracking-normal
              focus:outline-none focus:border-white/30 focus:bg-white/10
              disabled:opacity-50
              transition-all
            "
            autoComplete="one-time-code"
          />
          
          <button
            type="submit"
            disabled={loading || !code.trim()}
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
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => {
              setCode('');
              handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
            }}
            disabled={loading}
            className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors disabled:opacity-50"
          >
            Resend code
          </button>
          <button
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
            className="text-sm text-foreground/30 hover:text-foreground/50 transition-colors"
          >
            Use different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <form onSubmit={handleSendOtp} className="space-y-6">
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
        We&apos;ll send you a code
      </p>
    </div>
  );
}
