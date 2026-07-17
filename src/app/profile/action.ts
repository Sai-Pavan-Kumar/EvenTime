"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache"; // NEW: Imported for cache revalidation

export async function deleteEventAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  
  const eventId = formData.get("eventId") as string;
  if (!eventId) return { error: "No event ID" };
  
  // Verify ownership before deleting AND fetch the poster_url
  const { data: event } = await supabase
    .from("events")
    .select("creator_id, poster_url")
    .eq("id", eventId)
    .single();
    
  if (event?.creator_id !== user.id) return { error: "Unauthorized" };
  
  // Soft delete: just mark the event, move it to the 30-day trash.
  // Image is NOT removed from R2 here — only the 30-day purge job removes it,
  // since the event can still be viewed/restored from trash before then.
  await supabase.from("events").update({ status: "deleted" }).eq("id", eventId);

  // Bust the homepage/city/category caches so the deleted event disappears immediately
  revalidateTag("events", "events");
  revalidatePath("/", "layout");
  revalidatePath("/cities/[city]", "page");

  redirect("/profile");
}

// NEW: Server action for creating a college securely
export async function createCollegeAction(collegeName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };
  
  const trimmed = collegeName.trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 100) {
    return { error: "College name must be between 3 and 100 characters." };
  }
  
  // Check for near-duplicate first
  const { data: existing } = await supabase
    .from("colleges")
    .select("id, name")
    .ilike("name", trimmed)
    .maybeSingle();
    
  if (existing) return { data: existing }; // return existing, don't duplicate
  
 const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { data, error } = await supabase
    .from("colleges")
    .insert([{ name: trimmed, slug: `${slug}-${Date.now()}` }])
    .select("id, name, slug")
    .single();

  if (error) {
    // 23505 = unique constraint violation — someone else created the exact same college a split second before us. Instead of showing an error, just fetch and return that one, since it's the same college anyway.
    if (error.code === "23505") {
      const { data: raceWinner } = await supabase
        .from("colleges")
        .select("id, name, slug")
        .ilike("name", trimmed)
        .maybeSingle();
      if (raceWinner) return { data: raceWinner };
    }
    return { error: "Failed to add college." };
  }
  
  revalidatePath("/");
  return { data };
}
// NEW: Server action for platform feedback
export async function submitFeedbackAction(type: 'bug' | 'feature', message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const trimmedMessage = message?.trim() || "";
  if (!trimmedMessage) {
    return { error: "Message cannot be empty." };
  }
  if (trimmedMessage.length > 500) {
    return { error: "Message must be 500 characters or less." };
  }

  if (user) {
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recent } = await supabase
      .from("platform_feedback")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", oneMinuteAgo)
      .limit(1);
      
    if (recent && recent.length > 0) {
      return { error: "Please wait a minute before submitting again." };
    }
  } else {
    // Anonymous users have no user_id — rate limit by IP using the
    // same rate_limits table the /api/extract route already uses.
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const clientIp = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "unknown-ip";

    const { data: rlData } = await supabase
      .from("rate_limits")
      .select("request_count, reset_at")
      .eq("ip_address", clientIp)
      .eq("endpoint", "/profile/feedback")
      .single();

    const now = new Date();

    if (rlData && new Date(rlData.reset_at) > now) {
      if (rlData.request_count >= 3) {
        return { error: "Please wait a minute before submitting again." };
      }
      await supabase
        .from("rate_limits")
        .update({ request_count: rlData.request_count + 1 })
        .eq("ip_address", clientIp)
        .eq("endpoint", "/profile/feedback");
    } else {
      const resetAt = new Date(now.getTime() + 60000);
      if (rlData) {
        await supabase
          .from("rate_limits")
          .update({ request_count: 1, reset_at: resetAt.toISOString() })
          .eq("ip_address", clientIp)
          .eq("endpoint", "/profile/feedback");
      } else {
        await supabase
          .from("rate_limits")
          .insert({ ip_address: clientIp, endpoint: "/profile/feedback", request_count: 1, reset_at: resetAt.toISOString() });
      }
    }
  }
  
  const { error } = await supabase
    .from("platform_feedback")
    .insert([{ 
      type, 
      message: trimmedMessage,
      user_id: user?.id || null 
    }]);
    
  if (error) return { error: "Failed to submit feedback." };
  
  return { success: true };
}