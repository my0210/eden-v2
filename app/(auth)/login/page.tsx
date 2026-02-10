'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const OTP_LENGTH = 8;
const RESEND_COOLDOWN_SECONDS = 60;
const STORAGE_KEY = 'huuman_login_state';

// ---------------------------------------------------------------------------
// Persist login state so the PWA survives being backgrounded
// ---------------------------------------------------------------------------
function saveLoginState(email: string, step: 'email' | 'otp', sentAt: number) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email, step, sentAt })
    );
  } catch {
    // sessionStorage unavailable — non-critical
  }
}

function loadLoginState(): {
  email: string;
  step: 'email' | 'otp';
  sentAt: number;
} | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire stored state after 10 minutes
    if (Date.now() - parsed.sentAt > 10 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearLoginState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Friendly error messages
// ---------------------------------------------------------------------------
function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('rate') || lower.includes('limit') || lower.includes('too many'))
    return 'Too many attempts. Please wait a minute and try again.';
  if (lower.includes('expired') || lower.includes('invalid') || lower.includes('token'))
    return 'Code expired or invalid. Tap "Resend code" for a fresh one.';
  if (lower.includes('email') && lower.includes('not'))
    return 'Could not reach that email address. Please double-check it.';
  return msg;
}

// ---------------------------------------------------------------------------
// OTP digit box input
// ---------------------------------------------------------------------------
function OtpInput({
  value,
  onChange,
  disabled,
  onComplete,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  onComplete: (code: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(raw);
    if (raw.length === OTP_LENGTH) {
      onComplete(raw);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      e.preventDefault();
      onChange(pasted);
      if (pasted.length === OTP_LENGTH) {
        onComplete(pasted);
      }
    }
  };

  return (
    <div className="relative">
      {/* Visual digit boxes */}
      <div className="flex gap-1.5 justify-center">
        {digits.map((d, i) => (
          <div
            key={i}
            style={{
              width: 36,
              height: 48,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 500,
              border: d
                ? '1.5px solid rgba(255,255,255,0.5)'
                : i === value.length
                  ? '1.5px solid rgba(255,255,255,0.4)'
                  : '1px solid rgba(255,255,255,0.2)',
              background: d
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(255,255,255,0.08)',
              color: d ? '#fff' : 'rgba(255,255,255,0.2)',
            }}
          >
            {d || ''}
          </div>
        ))}
      </div>

      {/* Hidden real input for mobile keyboard / autofill */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        disabled={disabled}
        maxLength={OTP_LENGTH}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 1,
          color: 'transparent',
          caretColor: 'transparent',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          fontSize: 16,
        }}
        aria-label="One-time code"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resend countdown hook
// ---------------------------------------------------------------------------
function useCountdown(sentAt: number | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!sentAt) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - sentAt) / 1000);
      const left = Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
      setRemaining(left);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sentAt]);

  return remaining;
}

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);

  const supabase = createClient();
  const router = useRouter();
  const codeInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const resendCountdown = useCountdown(sentAt);

  // ---- Restore state if the PWA was backgrounded ----
  useEffect(() => {
    const saved = loadLoginState();
    if (saved) {
      setEmail(saved.email);
      setSentAt(saved.sentAt);
      if (saved.step === 'otp') {
        setStep('otp');
      }
    }
  }, []);

  // Focus the right input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } else {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [step]);

  // ---- Send OTP ----
  const handleSendOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;
      setError(null);
      setLoading(true);

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: true,
          },
        });

        if (error) {
          setError(friendlyError(error.message));
          return;
        }

        const now = Date.now();
        setSentAt(now);
        setStep('otp');
        saveLoginState(email.trim(), 'otp', now);
      } catch {
        setError('Network error. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, supabase.auth]
  );

  // ---- Verify OTP (auto-fires on 6 digits) ----
  const handleVerifyOtp = useCallback(
    async (token: string) => {
      if (loading) return;
      setError(null);
      setLoading(true);

      try {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: 'email',
        });

        if (error) {
          setError(friendlyError(error.message));
          setCode('');
          setTimeout(() => codeInputRef.current?.focus(), 100);
          return;
        }

        clearLoginState();
        router.push('/chat');
        router.refresh();
      } catch {
        setError('Network error. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, loading, router, supabase.auth]
  );

  // ---- Resend OTP ----
  const handleResend = useCallback(() => {
    setCode('');
    setError(null);
    handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
  }, [handleSendOtp]);

  const handlePasteFromClipboard = useCallback(async () => {
    if (loading || !navigator.clipboard?.readText) return;
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
      if (!digits) return;
      setCode(digits);
      if (digits.length === OTP_LENGTH) {
        handleVerifyOtp(digits);
      }
    } catch {
      // Ignore clipboard permission/read failures.
    }
  }, [handleVerifyOtp, loading]);

  // ================================================================
  // OTP step
  // ================================================================
  if (step === 'otp') {
    return (
      <div className="animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-foreground/60 mb-1">Enter the code sent to</p>
          <p className="text-foreground/80 text-sm font-medium">{email}</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400/80 text-sm text-center mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6 mb-8">
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={loading}
            onComplete={handleVerifyOtp}
            inputRef={codeInputRef}
          />

          {loading && (
            <p className="text-center text-foreground/40 text-sm animate-pulse">
              Verifying...
            </p>
          )}
        </div>

        {/* Hint */}
        <p className="text-center text-foreground/25 text-xs mb-6">
          Don&apos;t see it? Check your spam folder.
        </p>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handlePasteFromClipboard}
            disabled={loading}
            className="text-sm text-foreground/45 hover:text-foreground/65 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Paste code
          </button>
          <button
            onClick={handleResend}
            disabled={loading || resendCountdown > 0}
            className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resendCountdown > 0
              ? `Resend code in ${resendCountdown}s`
              : 'Resend code'}
          </button>
          <button
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
              clearLoginState();
            }}
            className="text-sm text-foreground/30 hover:text-foreground/50 transition-colors"
          >
            Use different email
          </button>
        </div>
      </div>
    );
  }

  // ================================================================
  // Email entry step (default)
  // ================================================================
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
            ref={emailInputRef}
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
        We&apos;ll email you a code. No password needed.
      </p>
    </div>
  );
}
