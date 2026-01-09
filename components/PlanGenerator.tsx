'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PlanGeneratorProps {
  hasPlan: boolean;
  weekStartDate: string;
}

export function PlanGenerator({ hasPlan, weekStartDate }: PlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!hasPlan && !isGenerating) {
      generatePlan();
    }
  }, [hasPlan]);

  const generatePlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStartDate }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate plan');
      }

      // Refresh the page to show the new plan
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsGenerating(false);
    }
  };

  if (hasPlan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center p-8 max-w-sm">
        {isGenerating ? (
          <>
            <div className="w-12 h-12 mx-auto mb-6 rounded-full border-2 border-white/20 border-t-green-400 animate-spin" />
            <p className="text-foreground/60 mb-2">Creating your protocol...</p>
            <p className="text-foreground/30 text-sm">Eden is personalizing your plan</p>
          </>
        ) : error ? (
          <>
            <p className="text-red-400/80 mb-4">{error}</p>
            <button
              onClick={generatePlan}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-foreground/80 hover:bg-white/15 transition-all"
            >
              Try Again
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

