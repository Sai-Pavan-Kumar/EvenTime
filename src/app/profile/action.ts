"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache"; // NEW: Imported for cache revalidation

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
    
  if (error) return { error: "Failed to add college." };
  
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