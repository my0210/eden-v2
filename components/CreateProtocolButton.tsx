'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateProtocolButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);

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

  return (
    <div className="space-y-3">
      <button
        onClick={handleCreate}
        disabled={isLoading}
        className={`
          px-6 py-3 rounded-xl
          bg-green-500/20 border border-green-500/30
          text-green-400 text-sm font-medium
          hover:bg-green-500/30 hover:border-green-500/40
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
            Creating your protocol...
          </>
        ) : (
          'Create 12-Week Protocol'
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
