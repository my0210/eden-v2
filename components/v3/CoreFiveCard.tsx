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
  MoreHorizontal,
  Timer,
  Camera,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Haptics, Sounds } from "@/lib/soul";
import { springs } from "@/components/live/interactions";

interface CoreFiveCardProps {
  config: PillarConfig;
  current: number;
  onLogClick: () => void;
  onQuickLog?: (value: number) => Promise<void>;
  onCardClick?: () => void;
  onTimerClick?: () => void;
  onScanClick?: () => void;
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

// Per-pillar deep links for agent actions
interface DeepLink {
  label: string;
  url: string;
}

const PILLAR_DEEP_LINKS: Partial<Record<Pillar, DeepLink[]>> = {
  cardio: [
    { label: "Find a route", url: "https://www.google.com/maps/search/running+trail+near+me" },
    { label: "Find a class", url: "https://classpass.com/search?category=cycling,running,swimming" },
  ],
  strength: [
    { label: "Find a gym", url: "https://www.google.com/maps/search/gym+near+me" },
  ],
  mindfulness: [
    { label: "Headspace", url: "https://www.headspace.com/meditation" },
    { label: "YouTube", url: "https://www.youtube.com/results?search_query=guided+meditation+10+minutes" },
  ],
  clean_eating: [
    { label: "Healthy food", url: "https://www.google.com/maps/search/healthy+food+near+me" },
  ],
};

export function CoreFiveCard({
  config,
  current,
  onLogClick,
  onQuickLog,
  onCardClick,
  onTimerClick,
  onScanClick,
  readOnly,
  justCompleted,
}: CoreFiveCardProps) {
  const { id: pillarId, name, weeklyTarget, unit, description, color, icon } = config;
  const progress = Math.min((current / weeklyTarget) * 100, 100);
  const isMet = current >= weeklyTarget;
  const isQuickTap = QUICK_TAP_PILLARS.includes(pillarId) && onQuickLog;
  const [quickLogging, setQuickLogging] = useState(false);

  const IconComponent = iconComponents[icon] || Heart;

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
      className={cn(
        "relative overflow-hidden p-5 flex flex-col justify-between h-full group",
        justCompleted && "animate-pulse-glow"
      )}
      style={{
        // Dynamic glow based on pillar color
        boxShadow: isMet 
          ? `0 0 40px -10px ${color}40` 
          : undefined,
        borderColor: isMet ? `${color}60` : undefined,
        // CSS variable for pulse-glow animation color
        '--glow-color': `${color}50`,
      } as React.CSSProperties}
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20"
        style={{
          background: `radial-gradient(circle at top right, ${color}, transparent 70%)`
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-sm"
            style={{ backgroundColor: `${color}20` }}
          >
            <IconComponent 
              className="w-5 h-5 transition-transform group-hover:scale-110" 
              style={{ color }} 
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white leading-tight">{name}</h3>
            <p className="text-xs text-white/50 font-medium">{description}</p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center">
          <AnimatePresence>
            {isMet && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <Check className="w-3.5 h-3.5 text-black font-bold" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Section */}
      <div className="relative z-10 mt-auto">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1">
            <span 
              className="text-3xl font-display font-bold tracking-tight"
              style={{ color: isMet ? color : "white" }}
            >
              {current}
            </span>
            <span className="text-sm text-white/40 font-medium">
              / {weeklyTarget} {unit}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 rounded-full bg-white/5 overflow-hidden backdrop-blur-sm border border-white/5">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
            style={{ 
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}80`
            }}
          />
        </div>
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
          {isQuickTap ? (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleQuickLog(1, e)}
                disabled={quickLogging}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {quickLogging ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {pillarId === 'clean_eating' ? 'On-plan' : 'Session'}
                  </>
                )}
              </motion.button>
              {pillarId === 'clean_eating' && onScanClick && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    Haptics.light();
                    onScanClick();
                  }}
                  className="p-2.5 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color }}
                >
                  <Camera className="w-5 h-5" />
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  Haptics.light();
                  onLogClick();
                }}
                className="p-2.5 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </motion.button>
            </div>
          ) : pillarId === 'mindfulness' && onTimerClick ? (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  Haptics.light();
                  onTimerClick();
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:brightness-110"
                style={{ backgroundColor: `${color}20`, color }}
              >
                <Timer className="w-4 h-4" />
                Breathwork
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  Haptics.light();
                  onLogClick();
                }}
                className="p-2.5 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.6)' }}
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
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:brightness-110"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Plus className="w-4 h-4" />
              Log {name}
            </motion.button>
          )}
        </div>
      )}

      {/* Deep Links */}
      {!readOnly && PILLAR_DEEP_LINKS[pillarId] && (
        <div className="relative z-10 mt-2 flex gap-2 flex-wrap">
          {PILLAR_DEEP_LINKS[pillarId]!.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
