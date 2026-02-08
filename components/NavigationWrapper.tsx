"use client";

import { ChatOverlay } from "@/components/ChatOverlay";
import { FloatingDock } from "@/components/ui/FloatingDock";

export function NavigationWrapper() {
  return (
    <ChatOverlay
      trigger={<div />}
      customTrigger={(open) => (
        <FloatingDock
          onChatClick={open}
          onSettingsClick={() => {
            const settingsBtn = document.querySelector('[aria-label="Settings"]');
            if (settingsBtn instanceof HTMLElement) settingsBtn.click();
          }}
          onHomeClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    />
  );
}
