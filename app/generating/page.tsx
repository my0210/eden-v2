'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const PERSONALIZATION_MESSAGES = [
  'Analyzing your goals...',
  'Reviewing your schedule...',
  'Considering your constraints...',
  'Balancing the five domains...',
  'Optimizing for your capacity...',
  'Crafting your weekly rhythm...',
  'Personalizing recommendations...',
  'Finalizing your plan...',
];

export default function GeneratingPage() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Cycle through messages
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % PERSONALIZATION_MESSAGES.length);
    }, 2000);

    // Generate the plan
    generatePlan();

    return () => clearInterval(messageInterval);
  }, []);

  const generatePlan = async () => {
    try {
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate plan');
      }

      // Small delay for UX, then redirect
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/week');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Ambient gradient orb - more prominent during generation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[600px] h-[600px]">
          {/* Primary breathing orb */}
          <div 
            className="absolute inset-0 rounded-full opacity-40 blur-[100px] animate-breathe"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(16,185,129,0.3) 40%, transparent 70%)',
            }}
          />
          {/* Secondary pulse */}
          <div 
            className="absolute inset-20 rounded-full opacity-30 blur-[60px] animate-breathe-delayed"
            style={{
              background: 'radial-gradient(circle, rgba(52,211,153,0.6) 0%, transparent 60%)',
            }}
          />
          {/* Inner glow */}
          <div 
            className="absolute inset-40 rounded-full opacity-50 blur-[40px] animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(74,222,128,0.4) 0%, transparent 50%)',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Wordmark */}
        <h1 className="text-4xl font-light tracking-tight mb-8 text-foreground/80">
          eden
        </h1>

        {error ? (
          <div className="space-y-6 animate-fade-in">
            <p className="text-red-400/80">{error}</p>
            <button
              onClick={() => {
                setError(null);
                generatePlan();
              }}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-foreground/80 hover:bg-white/15 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Rotating dots loader */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-green-400/60"
                  style={{
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>

            {/* Personalization message */}
            <p 
              key={messageIndex}
              className="text-foreground/50 text-lg animate-fade-in"
            >
              {PERSONALIZATION_MESSAGES[messageIndex]}
            </p>

            {/* Subtle helper text */}
            <p className="text-foreground/20 text-sm">
              Creating your personalized week
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

