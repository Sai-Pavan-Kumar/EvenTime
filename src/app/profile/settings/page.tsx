import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch existing profile data (Added year_of_studying)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, city, role, college, branch, graduation_year, year_of_studying, goals, is_onboarded")
    .eq("id", user.id)
    .single();

  // NEW: Fetch active events to calculate counts per category
  const today = new Date().toISOString();
  const { data: activeEvents } = await supabase
    .from("events")
    .select("category")
    .eq("is_published" as any, true) // FIXED: Bypasses outdated local TS definitions
    .gte("start_time" as any, today); // FIXED: Bypasses outdated local TS definitions

  // Aggregate category counts (Robust parsing added to prevent failures if categories are arrays)
  const categoryCounts: Record<string, number> = {};
  if (activeEvents) {
    activeEvents.forEach(event => {
      if (event.category) {
        let cats: string[] = [];
        if (Array.isArray(event.category)) {
          cats = event.category;
        } else if (typeof event.category === 'string') {
          try {
            const parsed = JSON.parse(event.category);
            cats = Array.isArray(parsed) ? parsed : [event.category];
          } catch {
            cats = [event.category];
          }
        }
        cats.forEach(c => {
          categoryCounts[c] = (categoryCounts[c] || 0) + 1;
        });
      }
    });
  }

  // Cast profile to any to bypass strict Typescript errors until global types are updated
  return <SettingsClient profile={profile as any} categoryCounts={categoryCounts} />;
}