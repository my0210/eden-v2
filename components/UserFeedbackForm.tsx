'use client';

import { useState } from 'react';

interface UserFeedbackFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const RATING_EMOJIS = [
  { value: 1, emoji: '😠', label: 'Very unhappy' },
  { value: 2, emoji: '😕', label: 'Unhappy' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Happy' },
  { value: 5, emoji: '😍', label: 'Love it' },
] as const;

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export function UserFeedbackForm({ onSuccess, onClose }: UserFeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === null) return;

    setSubmitState('loading');
    setError(null);

    try {
      const response = await fetch('/api/user-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, message: message.trim() || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitState('success');
      onSuccess?.();
    } catch (err) {
      setSubmitState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (submitState === 'success') {
    return (
      <div
        className="w-[280px] max-w-[calc(100vw-2rem)] p-4 rounded-xl"
        style={{
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="text-center py-4">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-white/80 text-sm">Thanks for your feedback!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[280px] max-w-[calc(100vw-2rem)] p-4 rounded-xl"
      style={{
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/90 text-sm font-medium">How&apos;s Huuman?</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/60 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Emoji Rating */}
      <div className="flex justify-between mb-4">
        {RATING_EMOJIS.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => setRating(value)}
            className={`
              w-11 h-11 rounded-lg text-xl flex items-center justify-center
              transition-all duration-150 active:scale-[0.95]
              ${rating === value 
                ? 'bg-white/20 scale-110' 
                : 'bg-white/5 hover:bg-white/10'
              }
            `}
            aria-label={label}
            title={label}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Input */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell us more (optional)"
        className="w-full h-20 px-3 py-2 rounded-lg text-sm text-white/90 placeholder-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
        }}
      />

      {/* Error Message */}
      {error && (
        <p className="text-red-400/80 text-xs mt-2">{error}</p>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={rating === null || submitState === 'loading'}
        className={`
          w-full mt-3 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-150 active:scale-[0.98]
          ${rating !== null 
            ? 'bg-white/15 text-white hover:bg-white/20' 
            : 'bg-white/5 text-white/30 cursor-not-allowed'
          }
        `}
      >
        {submitState === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </span>
        ) : (
          'Send Feedback'
        )}
      </button>
    </div>
  );
}
