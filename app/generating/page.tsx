'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const GENERATION_MESSAGES = [
  'Analyzing your goals...',
  'Reviewing your constraints...',
  'Selecting key activities...',
  'Personalizing recommendations...',
  'Building your 12-week protocol...',
  'Finalizing your plan...',
];

export default function GeneratingPage() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Cycle through messages
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % GENERATION_MESSAGES.length);
    }, 2500);

    // Generate the protocol
    generateProtocol();

    return () => clearInterval(messageInterval);
  }, []);

  const generateProtocol = async () => {
    try {
      // Check if protocol already exists
      const protocolCheck = await fetch('/api/protocol/current');
      const protocolData = await protocolCheck.json();
      
      // If no active protocol, generate one
      if (!protocolData.protocol) {
        const response = await fetch('/api/protocol/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate protocol');
        }
      }

      // Small delay for UX, then redirect to main week view
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/week');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Ambient gradient orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[600px] h-[600px]">
          <div 
            className="absolute inset-0 rounded-full opacity-40 blur-[100px] animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(16,185,129,0.3) 40%, transparent 70%)',
            }}
          />
          <div 
            className="absolute inset-20 rounded-full opacity-30 blur-[60px] animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(52,211,153,0.6) 0%, transparent 60%)',
              animationDelay: '0.5s',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        <h1 className="text-4xl font-light tracking-tight mb-8 text-foreground/80">
          huuman
        </h1>

        {error ? (
          <div className="space-y-6 animate-in fade-in">
            <p className="text-red-400/80">{error}</p>
            <button
              onClick={() => {
                setError(null);
                generateProtocol();
              }}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-foreground/80 hover:bg-white/15 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Loading dots */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-green-400/60 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* Message */}
            <p 
              key={messageIndex}
              className="text-foreground/50 text-lg animate-in fade-in"
            >
              {GENERATION_MESSAGES[messageIndex]}
            </p>

            <p className="text-foreground/20 text-sm">
              Creating your personalized protocol
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
