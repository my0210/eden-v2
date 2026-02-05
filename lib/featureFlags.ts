// Feature flags for Eden v3
// When V3_FOCUSED is true, the app hides non-essential features and shows the Core Five experience

// Hardcoded to true for v3 launch - change to false to restore v2 features
export const V3_FOCUSED = true;

// Features hidden when V3_FOCUSED is true:
// - You tab (YouButton, YouOverlay, metrics components)
// - Chat overlay (ChatOverlay, ChatInput, SuggestedPrompts)
// - Protocol page (AI-generated 12-week protocol)
// - Plan generator / daily tasks (PlanGenerator, DayView, PlanItemCard)
