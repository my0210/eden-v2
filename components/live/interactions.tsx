"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// Spring Presets
// ============================================================================

export const springs = {
  /** Standard tap response — every tappable surface */
  tap: { type: "spring" as const, stiffness: 400, damping: 15 },
  /** Gentle layout shifts */
  gentle: { type: "spring" as const, stiffness: 200, damping: 20 },
  /** Bouncy for celebrations (pillar completion, streak) */
  bouncy: { type: "spring" as const, stiffness: 400, damping: 10 },
  /** Snappy for navigation and message entrance */
  snappy: { type: "spring" as const, stiffness: 300, damping: 25 },
};

/** Scale-down presets for whileTap */
export const tapScale = { scale: 0.96 };
export const tapScaleSmall = { scale: 0.98 };
export const tapScaleLarge = { scale: 0.94 };

// ============================================================================
// Animation Variants
// ============================================================================

/** Incoming chat message: fade in + slide up + deblur */
export const messageEntrance = {
  initial: { opacity: 0, y: 8, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/** Tab content slide with direction */
export const tabSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

/** Send button: spring-in with overshoot, spring-out upward */
export const sendButtonVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: [0, 1.15, 1], opacity: 1 },
  exit: { scale: 0.8, opacity: 0, y: -8 },
};

// ============================================================================
// Ripple Component — touch-point radial glow on any surface
// ============================================================================

interface RippleItem {
  id: number;
  x: number;
  y: number;
}

export function Ripple({
  children,
  className = "",
  color = "rgba(255,255,255,0.12)",
  disabled = false,
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const nextId = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const id = nextId.current++;
      setRipples((prev) => [
        ...prev,
        { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
      ]);
      setTimeout(
        () => setRipples((prev) => prev.filter((r) => r.id !== id)),
        600
      );
    },
    [disabled]
  );

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      style={style}
    >
      {children}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: r.x - 30,
              top: r.y - 30,
              width: 60,
              height: 60,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
