"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FloatingDock } from "@/components/ui/FloatingDock";
import { SettingsOverlay } from "@/components/SettingsOverlay";
import { UnitSystem, GlucoseUnit, LipidsUnit } from "@/lib/types";

interface NavigationWrapperProps {
  isAdmin?: boolean;
  unitSystem?: UnitSystem;
  glucoseUnit?: GlucoseUnit;
  lipidsUnit?: LipidsUnit;
  coachingStyle?: {
    tone: 'supportive' | 'neutral' | 'tough';
    density: 'minimal' | 'balanced' | 'detailed';
    formality: 'casual' | 'professional' | 'clinical';
  };
}

export function NavigationWrapper({
  isAdmin,
  unitSystem,
  glucoseUnit,
  lipidsUnit,
  coachingStyle,
}: NavigationWrapperProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <FloatingDock
        onChatClick={() => router.push("/chat")}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onHomeClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <SettingsOverlay
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isAdmin={isAdmin}
        initialUnitSystem={unitSystem}
        initialGlucoseUnit={glucoseUnit}
        initialLipidsUnit={lipidsUnit}
        initialCoachingStyle={coachingStyle}
      />
    </>
  );
}
