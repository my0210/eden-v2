'use client';

import { useState } from 'react';
import { PlanItem, Domain, DOMAIN_COLORS } from '@/lib/types';

interface PlanItemCardProps {
  item: PlanItem;
  isPriority: boolean;
}

export function PlanItemCard({ item, isPriority }: PlanItemCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const domainColor = DOMAIN_COLORS[item.domain as Domain];

  const handleStatusUpdate = async (newStatus: 'done' | 'skipped') => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/plan/item/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
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
      p-4 rounded-xl 
      bg-white/5 border border-white/10
      transition-all duration-300
      hover:bg-white/[0.07] hover:border-white/15
      ${isComplete || isSkipped ? 'opacity-50' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Domain dot */}
        <div 
          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
          style={{ backgroundColor: domainColor }}
        />
        
        <div className="flex-1 min-w-0">
          <h3 className={`
            font-medium text-foreground/90
            ${isComplete || isSkipped ? 'line-through text-foreground/40' : ''}
          `}>
            {item.title}
          </h3>

          <p className="text-foreground/40 text-sm mt-1">
            {item.durationMinutes && (
              <span className="text-foreground/30">{item.durationMinutes}m · </span>
            )}
            {item.personalizationContext}
          </p>
        </div>
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
        {item.status === 'pending' ? (
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
                ml-auto px-3 py-2 text-sm
                text-foreground/30
                hover:text-foreground/50
                transition-colors
              "
            >
              {showReasoning ? 'Hide' : 'Why?'}
            </button>
          </>
        ) : (
          <span className="text-sm text-foreground/30">
            {isComplete ? '✓ Done' : 'Skipped'}
          </span>
        )}
      </div>
    </div>
  );
}
