import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch existing profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, preferred_cities, user_type, college, college_id, branch, graduation_year, goals, is_onboarded")
    .eq("id", user.id)
    .single();
  // College list is fetched client-side in SettingsClient for better search UX

  // NEW: Fetch active events to calculate counts per category
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const { data: activeEvents } = await supabase
    .from("events")
    .select("category, city")
    .eq("status", "approved")
    .gte("date_string", todayStr);

  // Aggregate category counts (Robust parsing added to prevent failures if categories are arrays)
  const categoryCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};
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
      if ((event as any).city) {
        cityCounts[(event as any).city] = (cityCounts[(event as any).city] || 0) + 1;
      }
    });
  }

  // Cast profile to any to bypass strict Typescript errors until global types are updated
 return <SettingsClient profile={profile as any} categoryCounts={categoryCounts} cityCounts={cityCounts} userEmail={user.email} />;
}