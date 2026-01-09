'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlanItem, Domain, DOMAIN_COLORS } from '@/lib/types';

interface PlanItemCardProps {
  item: PlanItem;
  isPriority: boolean;
}

// Domain icons as inline SVG components
function DomainIcon({ domain, color }: { domain: Domain; color: string }) {
  const iconProps = {
    className: "w-4 h-4 flex-shrink-0",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: color,
    strokeWidth: 1.5,
  };

  switch (domain) {
    case 'heart':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      );
    case 'muscle':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l1-3 2 6 2-6 2 6 1-3h2M17 8v8M21 8v8M17 12h4" />
        </svg>
      );
    case 'sleep':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      );
    case 'metabolism':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
        </svg>
      );
    case 'mind':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function PlanItemCard({ item, isPriority }: PlanItemCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(item.status);
  const router = useRouter();

  const domainColor = DOMAIN_COLORS[item.domain as Domain];

  const handleAskEden = () => {
    const event = new CustomEvent('eden:askAboutItem', {
      detail: {
        itemTitle: item.title,
        itemContext: item.personalizationContext,
        question: `Tell me more about "${item.title}" - why is this in my plan and how should I approach it?`
      }
    });
    window.dispatchEvent(event);
  };

  const handleStatusUpdate = async (newStatus: 'done' | 'skipped' | 'pending') => {
    if (isUpdating) return;
    
    // Optimistic update
    const previousStatus = localStatus;
    setLocalStatus(newStatus);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/plan/item/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        setLocalStatus(previousStatus);
        throw new Error('Failed to update status');
      }
      
      // Soft refresh to update progress indicators
      router.refresh();
    } catch (error) {
      console.error('Error updating item status:', error);
      setLocalStatus(previousStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const isComplete = localStatus === 'done';
  const isSkipped = localStatus === 'skipped';
  const isPending = localStatus === 'pending';

  // Different styles based on status
  const cardClasses = `
    p-4 rounded-xl 
    transition-all duration-300
    ${isComplete 
      ? 'bg-green-500/5 border border-green-500/20 hover:bg-green-500/10' 
      : isSkipped 
        ? 'bg-white/[0.02] border border-white/5 opacity-50' 
        : 'bg-white/5 border border-white/10 hover:bg-white/[0.07] hover:border-white/15'
    }
  `;

  return (
    <div className={cardClasses}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Domain icon */}
        <div className="mt-0.5">
          <DomainIcon domain={item.domain as Domain} color={domainColor} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isComplete && (
              <span className="text-green-400/80 text-sm">✓</span>
            )}
            <h3 className={`
              font-medium
              ${isComplete 
                ? 'text-foreground/70' 
                : isSkipped 
                  ? 'line-through text-foreground/30' 
                  : 'text-foreground/90'
              }
            `}>
              {item.title}
            </h3>
          </div>

          <p className={`text-sm mt-1 ${isSkipped ? 'text-foreground/20' : 'text-foreground/40'}`}>
            {item.durationMinutes && (
              <span className="text-foreground/30">{item.durationMinutes}m · </span>
            )}
            {item.personalizationContext}
          </p>
        </div>

        {/* Ask Eden - anchored top right with expanding label */}
        <button
          onClick={handleAskEden}
          className="
            group flex-shrink-0
            h-8 px-2 rounded-full
            flex items-center gap-0
            text-foreground/20
            hover:text-foreground/50 hover:bg-white/5
            transition-all duration-300
          "
          aria-label="Ask Eden about this"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          <span className="
            max-w-0 overflow-hidden whitespace-nowrap
            group-hover:max-w-[80px] group-hover:ml-1.5
            transition-all duration-300 ease-out
            text-xs font-medium
          ">
            Ask Eden
          </span>
        </button>
      </div>

      {/* Reasoning */}
      {showReasoning && (
        <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in">
          <p className="text-sm text-foreground/40 leading-relaxed">
            {item.reasoning}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        {isPending ? (
          <>
            <button
              onClick={() => handleStatusUpdate('done')}
              disabled={isUpdating}
              className="
                px-4 py-2 rounded-lg text-sm
                bg-white/10 border border-white/10
                text-foreground/70
                hover:bg-white/15 hover:border-white/20
                disabled:opacity-50
                transition-all duration-300
              "
            >
              Done
            </button>
            <button
              onClick={() => handleStatusUpdate('skipped')}
              disabled={isUpdating}
              className="
                px-4 py-2 rounded-lg text-sm
                text-foreground/40
                hover:text-foreground/60 hover:bg-white/5
                disabled:opacity-50
                transition-all duration-300
              "
            >
              Skip
            </button>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="
                ml-auto w-8 h-8 rounded-full
                flex items-center justify-center
                text-foreground/25
                hover:text-foreground/50 hover:bg-white/5
                transition-all duration-300
              "
              aria-label={showReasoning ? 'Hide reasoning' : 'Show reasoning'}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${showReasoning ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </>
        ) : isComplete ? (
          <>
            <button
              onClick={() => handleStatusUpdate('pending')}
              disabled={isUpdating}
              className="
                px-3 py-1.5 rounded-lg text-xs
                text-foreground/40
                hover:text-foreground/60 hover:bg-white/5
                disabled:opacity-50
                transition-all duration-300
              "
            >
              Undo
            </button>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="
                ml-auto w-8 h-8 rounded-full
                flex items-center justify-center
                text-foreground/25
                hover:text-foreground/50 hover:bg-white/5
                transition-all duration-300
              "
              aria-label={showReasoning ? 'Hide reasoning' : 'Show reasoning'}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${showReasoning ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </>
        ) : (
          // Skipped state - minimal, just undo
          <button
            onClick={() => handleStatusUpdate('pending')}
            disabled={isUpdating}
            className="
              px-3 py-1.5 rounded-lg text-xs
              text-foreground/30
              hover:text-foreground/50 hover:bg-white/5
              disabled:opacity-50
              transition-all duration-300
            "
          >
            Undo skip
          </button>
        )}
      </div>
    </div>
  );
}
