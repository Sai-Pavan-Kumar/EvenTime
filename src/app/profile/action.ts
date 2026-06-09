"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache"; // NEW: Imported for cache revalidation
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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
  
  // Delete the associated image from Cloudflare R2
  if (event?.poster_url) {
    try {
      const url = new URL(event.poster_url);
      const key = url.pathname.substring(1); // Extract path without the leading slash

      // Only attempt to delete if it matches your R2 folder structure to avoid failing on external fallback images
      if (key.startsWith("events/")) {
        const s3Client = new S3Client({
          region: "auto",
          endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
          },
        });

        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
        }));
      }
    } catch (err) {
      // Log the error but don't block the database deletion if R2 fails
      console.error("Failed to delete image from R2:", err);
    }
  }

  await supabase.from("events").delete().eq("id", eventId);
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