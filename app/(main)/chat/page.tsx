import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TabShell } from "@/components/live/TabShell";

export default async function ChatPage() {
  const supabase = await createClient();

  // Layout already verified auth with getUser(). Use getSession() here to
  // skip the redundant Supabase API call — just read the JWT from the cookie.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  // Fetch user profile for settings + coaching style
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("coaching_style, is_admin, unit_system, glucose_unit, lipids_unit")
    .eq("id", user.id)
    .single();

  return (
    <TabShell
      userId={user.id}
      isAdmin={profile?.is_admin || false}
      coachingStyle={
        profile?.coaching_style || {
          tone: "supportive",
          density: "balanced",
          formality: "casual",
        }
      }
      unitSystem={profile?.unit_system || "metric"}
      glucoseUnit={profile?.glucose_unit || "mg/dL"}
      lipidsUnit={profile?.lipids_unit || "mg/dL"}
    />
  );
}
