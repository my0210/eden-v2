"use client";

import { useState } from "react";
import { Pillar, PillarConfig } from "@/lib/v3/coreFive";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Dumbbell, 
  Moon, 
  Leaf, 
  Brain, 
  Check, 
  Plus, 
  MoreHorizontal 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CoreFiveCardProps {
  config: PillarConfig;
  current: number;
  onLogClick: () => void;
  onQuickLog?: (value: number) => Promise<void>;
  onCardClick?: () => void;
  readOnly?: boolean;
  justCompleted?: boolean;
}

// Map pillar IDs to Lucide icons
export const iconComponents: Record<string, React.ElementType> = {
  heart: Heart,
  dumbbell: Dumbbell,
  moon: Moon,
  leaf: Leaf,
  brain: Brain,
};

// Pillars that support quick-tap (no modal needed)
const QUICK_TAP_PILLARS: Pillar[] = ["clean_eating", "strength"];

import { Haptics, Sounds } from "@/lib/soul";

export function CoreFiveCard({
  config,
  current,
  onLogClick,
  onQuickLog,
  onCardClick,
  readOnly,
  justCompleted,
}: CoreFiveCardProps) {
  // ... existing code ...

  const handleQuickLog = async (value: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuickLog || quickLogging) return;
    
    Haptics.light();
    setQuickLogging(true);
    
    try {
      await onQuickLog(value);
      Haptics.success();
      Sounds.playSuccess();
    } catch (error) {
      Haptics.error();
    } finally {
      setQuickLogging(false);
    }
  };

  return (
    <GlassCard
      variant="panel"
      hoverEffect={!!onCardClick}
      onClick={() => {
        if (onCardClick) {
          Haptics.light();
          onCardClick();
        }
      }}
      // ... rest of props
    >
      {/* ... existing JSX ... */}
      
      {/* Actions */}
      {!readOnly && (
        <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
          {isQuickTap ? (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleQuickLog(1, e)}
                // ... rest of button props
              >
                {/* ... button content ... */}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  Haptics.light();
                  onLogClick();
                }}
                // ... rest of button props
              >
                <MoreHorizontal className="w-5 h-5" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                Haptics.light();
                onLogClick();
              }}
              // ... rest of button props
            >
              <Plus className="w-4 h-4" />
              Log {name}
            </motion.button>
          )}
        </div>
      )}
    </GlassCard>
  );
}
