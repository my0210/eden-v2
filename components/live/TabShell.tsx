"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Settings } from "lucide-react";
import { ChatView } from "./ChatView";
import { CoreFiveView } from "@/components/v3/CoreFiveView";
import { SettingsOverlay } from "@/components/SettingsOverlay";
import { Haptics } from "@/lib/soul";
import {
  getWeekStart,
  getPrimeCoverage,
  type CoreFiveLog,
} from "@/lib/v3/coreFive";
import { springs } from "./interactions";
import { UnitSystem, GlucoseUnit, LipidsUnit } from "@/lib/types";

// ============================================================================
// Ambient orb intensity mapped to weekly coverage (0-5)
// ============================================================================

function getAmbientStyle(coverage: number) {
  const map: Record<number, { opacity: number; scale: number }> = {
    0: { opacity: 0.03, scale: 0.8 },
    1: { opacity: 0.05, scale: 0.85 },
    2: { opacity: 0.07, scale: 0.9 },
    3: { opacity: 0.09, scale: 0.95 },
    4: { opacity: 0.12, scale: 1.0 },
    5: { opacity: 0.17, scale: 1.05 },
  };
  return map[coverage] || map[0];
}

// ============================================================================
// TabShell
// ============================================================================

interface TabShellProps {
  userId: string;
  isAdmin?: boolean;
  coachingStyle?: {
    tone: "supportive" | "neutral" | "tough";
    density: "minimal" | "balanced" | "detailed";
    formality: "casual" | "professional" | "clinical";
  };
  unitSystem?: UnitSystem;
  glucoseUnit?: GlucoseUnit;
  lipidsUnit?: LipidsUnit;
}

export function TabShell({
  userId,
  isAdmin,
  coachingStyle,
  unitSystem,
  glucoseUnit,
  lipidsUnit,
}: TabShellProps) {
  const [activeTab, setActiveTab] = useState(0); // 0 = chat, 1 = dashboard
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [primeCoverage, setPrimeCoverage] = useState(0);
  const orbRef = useRef<HTMLDivElement>(null);

  // Drag-based swipe: tracks the horizontal offset of the tab tray
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isDragging = useRef(false);

  // Measure container once
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Orb parallax: subtle opposite shift derived from drag position
  const orbParallaxX = useTransform(dragX, (v) => -v * 0.06);

  // ---------------------------------------------------------------------------
  // Coverage for ambient orb — reads from localStorage (no extra fetch)
  // CoreFiveView writes to localStorage; we just read it.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const readCoverageFromCache = () => {
      try {
        const weekStart = getWeekStart(new Date());
        const cached = localStorage.getItem(`huuman_logs_${weekStart}`);
        if (cached) {
          const logs: CoreFiveLog[] = JSON.parse(cached);
          setPrimeCoverage(getPrimeCoverage(logs));
        }
      } catch { /* ignore */ }
    };

    readCoverageFromCache();

    // Re-read when logs change or app regains focus
    const onLogCreated = () => readCoverageFromCache();
    const onVisibility = () => {
      if (document.visibilityState === "visible") readCoverageFromCache();
    };

    window.addEventListener("huuman:logCreated", onLogCreated);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("huuman:logCreated", onLogCreated);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Drag gesture handlers for tab switching
  // ---------------------------------------------------------------------------
  const handleDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      // Compute the raw position based on current tab + drag offset
      const base = -activeTab * containerWidth;
      const raw = base + info.offset.x;
      const minX = -containerWidth;
      const maxX = 0;
      const clamped = Math.min(maxX, Math.max(minX, raw));

      dragX.set(clamped);
    },
    [activeTab, containerWidth, dragX]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      isDragging.current = false;
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      // Commit to tab switch if velocity or distance is sufficient
      let newTab = activeTab;
      if (velocity < -200 || offset < -containerWidth * 0.25) {
        newTab = Math.min(activeTab + 1, 1);
      } else if (velocity > 200 || offset > containerWidth * 0.25) {
        newTab = Math.max(activeTab - 1, 0);
      }

      if (newTab !== activeTab) {
        setActiveTab(newTab);
        Haptics.medium();
      }

      // Snap to final position
      animate(dragX, -newTab * containerWidth, {
        type: "spring",
        stiffness: 500,
        damping: 35,
        velocity: velocity,
      });
    },
    [activeTab, containerWidth, dragX]
  );

  // When activeTab changes via dot tap, animate the tray
  useEffect(() => {
    if (!isDragging.current && containerWidth > 0) {
      animate(dragX, -activeTab * containerWidth, {
        type: "spring",
        stiffness: 500,
        damping: 35,
      });
    }
  }, [activeTab, containerWidth, dragX]);

  // ---------------------------------------------------------------------------
  // Scroll-based orb fade — direct DOM mutation, no re-render
  // ---------------------------------------------------------------------------
  const ambientStyle = getAmbientStyle(primeCoverage);

  const handleContentScroll = useCallback((scrollTop: number) => {
    if (!orbRef.current) return;
    const fade = Math.max(0.3, 1 - scrollTop / 400);
    orbRef.current.style.opacity = String(ambientStyle.opacity * fade);
  }, [ambientStyle.opacity]);

  return (
    <div
      className="h-[100svh] flex flex-col overflow-hidden overscroll-none"
      style={{ backgroundColor: "#0a0a0b" }}
    >
      {/* ================================================================= */}
      {/* Shared ambient orb — GPU-composited layer                        */}
      {/* ================================================================= */}
      <div className="orb-container fixed inset-0 flex items-center justify-center pointer-events-none z-0" style={{ contain: "strict" }}>
        <motion.div
          className="relative w-[600px] h-[600px]"
          style={{ x: orbParallaxX, willChange: "transform" }}
          animate={{ scale: ambientStyle.scale }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <div
            ref={orbRef}
            className="absolute inset-0 rounded-full blur-[100px]"
            style={{
              opacity: ambientStyle.opacity,
              background:
                "radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)",
              willChange: "opacity",
              transform: "translateZ(0)",
            }}
          />
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Shared header                                                     */}
      {/* ================================================================= */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3 relative z-10">
        {/* Wordmark */}
        <span className="text-lg font-light tracking-tight text-white/40">
          huuman
        </span>

        {/* Tab indicator dots — active dot morphs into a pill */}
        <div className="flex items-center gap-2">
          {[0, 1].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => {
                if (activeTab !== tab) {
                  setActiveTab(tab);
                  Haptics.light();
                }
              }}
              whileTap={{ scale: 0.8 }}
              className="relative p-1"
            >
              <motion.div
                layout
                animate={{
                  width: activeTab === tab ? 16 : 6,
                  opacity: activeTab === tab ? 0.9 : 0.25,
                }}
                transition={springs.tap}
                className="h-[5px] rounded-full bg-white"
              />
            </motion.button>
          ))}
        </div>

        {/* Settings — rotates 90° on tap */}
        <motion.button
          whileTap={{ scale: 0.85, rotate: 90 }}
          transition={springs.tap}
          onClick={() => {
            setSettingsOpen(true);
            Haptics.light();
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
        >
          <Settings className="w-[18px] h-[18px]" />
        </motion.button>
      </header>

      {/* ================================================================= */}
      {/* Tab content — horizontal tray, drag to switch                     */}
      {/* ================================================================= */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative z-10"
      >
        <motion.div
          className="flex h-full"
          style={{ x: dragX, width: containerWidth ? containerWidth * 2 : "200%" }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: -containerWidth, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          {/* Chat tab */}
          <div
            className="h-full flex-shrink-0"
            style={{ width: containerWidth || "50%" }}
          >
            <ChatView
              onScroll={activeTab === 0 ? handleContentScroll : undefined}
            />
          </div>

          {/* Dashboard tab */}
          <div
            className="h-full flex-shrink-0 overflow-y-auto overscroll-contain"
            style={{ width: containerWidth || "50%" }}
            onScroll={(e) =>
              activeTab === 1 &&
              handleContentScroll(e.currentTarget.scrollTop)
            }
          >
            <CoreFiveView userId={userId} embedded />
          </div>
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Settings overlay — only mounted when open                        */}
      {/* ================================================================= */}
      {settingsOpen && (
        <SettingsOverlay
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          isAdmin={isAdmin}
          initialCoachingStyle={coachingStyle}
          initialUnitSystem={unitSystem}
          initialGlucoseUnit={glucoseUnit}
          initialLipidsUnit={lipidsUnit}
        />
      )}
    </div>
  );
}
