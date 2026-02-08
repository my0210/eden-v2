"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "subtle" | "panel" | "highlight";
  hoverEffect?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "panel", hoverEffect = false, children, ...props }, ref) => {
    const variantStyles = {
      subtle: "glass-subtle",
      panel: "glass-panel",
      highlight: "glass-highlight",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl transition-colors",
          variantStyles[variant],
          hoverEffect && "hover:bg-white/10 cursor-pointer",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        whileHover={hoverEffect ? { scale: 1.02 } : undefined}
        whileTap={hoverEffect ? { scale: 0.98 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
