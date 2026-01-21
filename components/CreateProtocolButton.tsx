'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateProtocolButtonProps {
  mode?: 'create' | 'regenerate';
}

export function CreateProtocolButton({ mode = 'create' }: CreateProtocolButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    // For regenerate, first deactivate the existing protocol
    if (mode === 'regenerate') {
      try {
        await fetch('/api/protocol/deactivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        // Continue even if deactivate fails
      }
    }

    setIsLoading(true);
    setError(null);
    setShowConfirm(false);

    try {
      const response = await fetch('/api/protocol/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create protocol');
      }

      // Refresh the page to show the new protocol
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (mode === 'regenerate') {
      setShowConfirm(true);
    } else {
      handleCreate();
    }
  };

  const buttonText = mode === 'regenerate' ? 'Regenerate Protocol' : 'Create 12-Week Protocol';
  const loadingText = mode === 'regenerate' ? 'Regenerating your protocol...' : 'Creating your protocol...';

  if (showConfirm) {
    return (
      <div className="space-y-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <p className="text-sm text-foreground/70">
          This will replace your current protocol with a new one. Your progress data will be preserved.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/30 transition-all"
          >
            Yes, regenerate
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground/60 text-sm hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          px-6 py-3 rounded-xl
          ${mode === 'regenerate' 
            ? 'bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30 hover:border-orange-500/40'
            : 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:border-green-500/40'
          }
          border text-sm font-medium
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText}
          </>
        ) : (
          buttonText
        )}
      </button>
      
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
      
      {isLoading && (
        <p className="text-foreground/40 text-xs">
          This takes about 15-30 seconds...
        </p>
      )}
    </div>
  );
}
