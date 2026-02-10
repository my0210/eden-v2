import { redirect } from "next/navigation";

// Dashboard is now tab 2 inside /chat (TabShell).
// Redirect for backwards compatibility.
export default function WeekPage() {
  redirect("/chat");
}
