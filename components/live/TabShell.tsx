"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { Settings } from "lucide-react";
import { ChatView } from "./ChatView";
import { CoreFiveView } from "@/components/v3/CoreFiveView";
import { SettingsOverlay } from "@/components/SettingsOverlay";
import { Haptics } from "@/lib/soul";
import {
  getWeekStart,
  getPrimeCoverage,
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
  const [scrollFade, setScrollFade] = useState(1);

  // Touch gesture tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Orb parallax motion value
  const orbParallaxX = useMotionValue(0);

  // ---------------------------------------------------------------------------
  // Fetch weekly coverage for ambient orb
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchCoverage = () => {
      const weekStart = getWeekStart(new Date());
      fetch(`/api/v3/log?week_start=${weekStart}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.logs) setPrimeCoverage(getPrimeCoverage(data.logs));
        })
        .catch(() => {});
    };

    fetchCoverage();

    // Re-fetch when logs change or app regains focus
    const onLogCreated = () => fetchCoverage();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchCoverage();
    };

    window.addEventListener("huuman:logCreated", onLogCreated);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("huuman:logCreated", onLogCreated);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Swipe gesture handlers
  // ---------------------------------------------------------------------------
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const deltaX = e.touches[0].clientX - touchStartX.current;
      // Orb shifts opposite to finger (parallax depth)
      orbParallaxX.set(-deltaX * 0.08);
    },
    [orbParallaxX]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) {
        animate(orbParallaxX, 0, springs.gentle);
        return;
      }

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      // Only trigger tab switch on clearly horizontal swipes
      if (
        Math.abs(deltaX) > 60 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5
      ) {
        if (deltaX < 0 && activeTab === 0) {
          // Swipe left → dashboard
          setActiveTab(1);
          Haptics.medium();
        } else if (deltaX > 0 && activeTab === 1) {
          // Swipe right → chat
          setActiveTab(0);
          Haptics.medium();
        }
      }

      // Animate orb back to center
      animate(orbParallaxX, 0, springs.gentle);
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [activeTab, orbParallaxX]
  );

  // ---------------------------------------------------------------------------
  // Scroll-based orb fade
  // ---------------------------------------------------------------------------
  const handleContentScroll = useCallback((scrollTop: number) => {
    const fade = Math.max(0.3, 1 - scrollTop / 400);
    setScrollFade(fade);
  }, []);

  const ambientStyle = getAmbientStyle(primeCoverage);

  return (
    <div
      className="h-[100dvh] flex flex-col"
      style={{ backgroundColor: "#0a0a0b" }}
    >
      {/* ================================================================= */}
      {/* Shared ambient orb                                                */}
      {/* ================================================================= */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <motion.div
          className="relative w-[800px] h-[800px]"
          style={{ x: orbParallaxX }}
          animate={{ scale: ambientStyle.scale }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <div
            className="absolute inset-0 rounded-full blur-[150px] transition-opacity duration-[2000ms] ease-out"
            style={{
              opacity: ambientStyle.opacity * scrollFade,
              background:
                "radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)",
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
      {/* Tab content — both always mounted, active one visible             */}
      {/* ================================================================= */}
      <div
        className="flex-1 overflow-hidden relative z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Chat tab */}
        <motion.div
          className="absolute inset-0"
          animate={{
            x: activeTab === 0 ? 0 : -20,
            opacity: activeTab === 0 ? 1 : 0,
            scale: activeTab === 0 ? 1 : 0.98,
          }}
          transition={springs.snappy}
          style={{ pointerEvents: activeTab === 0 ? "auto" : "none" }}
        >
          <ChatView
            onScroll={activeTab === 0 ? handleContentScroll : undefined}
          />
        </motion.div>

        {/* Dashboard tab */}
        <motion.div
          className="absolute inset-0"
          animate={{
            x: activeTab === 1 ? 0 : 20,
            opacity: activeTab === 1 ? 1 : 0,
            scale: activeTab === 1 ? 1 : 0.98,
          }}
          transition={springs.snappy}
          style={{ pointerEvents: activeTab === 1 ? "auto" : "none" }}
        >
          <div
            className="h-full overflow-y-auto overscroll-contain"
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
      {/* Settings overlay                                                  */}
      {/* ================================================================= */}
      <SettingsOverlay
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isAdmin={isAdmin}
        initialCoachingStyle={coachingStyle}
        initialUnitSystem={unitSystem}
        initialGlucoseUnit={glucoseUnit}
        initialLipidsUnit={lipidsUnit}
      />
    </div>
  );
}
