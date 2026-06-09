"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReportAction(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const reason = formData.get("reason") as string;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please login to report an event." };
  }

  // SECURITY FIX 3: Derive curatorId server-side to prevent form tampering
  const { data: event } = await supabase
    .from("events")
    .select("creator_id")
    .eq("id", eventId)
    .single();

  if (!event) return { error: "Event not found." };
  const curatorId = event.creator_id;

  // SECURITY FIX 1: Prevent Self-Reporting
  if (user.id === curatorId) {
    return { error: "You cannot report your own event." };
  }

  // SECURITY FIX 2: Rate Limiting (Max 5 active/pending reports per user)
  const { count: reportCount, error: countError } = await supabase
    .from("event_reports")
    .select("*", { count: "exact", head: true })
    .eq("reporter_id", user.id)
    .eq("status", "pending");

  if (countError) {
    console.error("Rate Limit Check Error: ", countError);
    return { error: "Failed to verify account status." };
  }

  if (reportCount && reportCount >= 5) {
    return { error: "You have reached the maximum limit of 5 pending reports. Please wait for admins to review them." };
  }

  // Insert report into database
  const { error } = await supabase.from("event_reports").insert({
    event_id: eventId,
    reporter_id: user.id,
    curator_id: curatorId,
    reason: reason,
    status: "pending"
  });

  if (error) {
    console.error("Report Submission Error: ", error);
    return { error: "Failed to submit report." };
  }
  
  // FIX: Clear the cache for the admin page so new reports show up immediately!
  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}