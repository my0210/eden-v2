'use client';

import { useState } from 'react';
import { PlanItem, Domain, DOMAIN_LABELS, DOMAIN_COLORS } from '@/lib/types';

interface PlanItemCardProps {
  item: PlanItem;
  isPriority: boolean;
}

export function PlanItemCard({ item, isPriority }: PlanItemCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const domainColor = DOMAIN_COLORS[item.domain as Domain];
  const domainLabel = DOMAIN_LABELS[item.domain as Domain];

  const handleStatusUpdate = async (newStatus: 'done' | 'skipped') => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/plan/item/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Optimistic update would go here, or trigger a revalidation
      window.location.reload();
    } catch (error) {
      console.error('Error updating item status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isComplete = item.status === 'done';
  const isSkipped = item.status === 'skipped';

  return (
    <div className={`
      card card-hover
      ${isPriority ? 'border-l-2' : ''}
      ${isComplete ? 'opacity-70' : ''}
      ${isSkipped ? 'opacity-50' : ''}
    `}
    style={isPriority ? { borderLeftColor: domainColor } : {}}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Priority Badge */}
          {isPriority && item.status === 'pending' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400 mb-1">
              ★ Priority
            </span>
          )}

          {/* Title */}
          <h3 className={`
            font-medium 
            ${isComplete ? 'line-through text-foreground-muted' : ''}
            ${isSkipped ? 'line-through text-foreground-subtle' : ''}
          `}>
            {item.title}
          </h3>

          {/* Personalization Context - Always visible */}
          <p className="text-foreground-muted text-sm mt-1">
            {item.durationMinutes && (
              <span className="text-foreground-subtle">
                {item.durationMinutes} min · 
              </span>
            )}
            {item.personalizationContext}
          </p>
        </div>

        {/* Domain Badge */}
        <span 
          className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
          style={{ 
            backgroundColor: `${domainColor}15`,
            color: domainColor,
          }}
        >
          {domainLabel}
        </span>
      </div>

      {/* Reasoning (expandable) */}
      {showReasoning && (
        <div className="mt-3 pt-3 border-t border-muted animate-fade-in">
          <p className="text-sm text-foreground-muted leading-relaxed">
            <span className="text-foreground-subtle font-medium">Why: </span>
            {item.reasoning}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-muted">
        {item.status === 'pending' ? (
          <>
            <button
              onClick={() => handleStatusUpdate('done')}
              disabled={isUpdating}
              className="btn btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
            >
              Done
            </button>
            <button
              onClick={() => handleStatusUpdate('skipped')}
              disabled={isUpdating}
              className="btn btn-ghost text-xs py-1.5 px-3 disabled:opacity-50"
            >
              Skip
            </button>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="btn btn-ghost text-xs py-1.5 px-3 ml-auto"
            >
              {showReasoning ? 'Hide Why' : 'Why?'}
            </button>
          </>
        ) : (
          <>
            <span className={`
              text-xs font-medium px-2 py-1 rounded-full
              ${isComplete ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}
            `}>
              {isComplete ? '✓ Completed' : '⊘ Skipped'}
            </span>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="btn btn-ghost text-xs py-1.5 px-3 ml-auto"
            >
              {showReasoning ? 'Hide Why' : 'Why?'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

