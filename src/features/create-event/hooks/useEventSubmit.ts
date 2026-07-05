import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TablesInsert } from "@/types/database";
import { toast } from "sonner";

type SubmitPayload = TablesInsert<"events"> & {
  imageFile?: File | null;
  previewUrl?: string | null;
};

export function useEventSubmit() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const generateSlug = (eventTitle: string, eventLocation: string, eventDate: Date | undefined): string => {
    const slugTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const city = eventLocation
      ? eventLocation.split(",")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : "online";
    const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const month = eventDate ? monthNames[eventDate.getMonth()] : "";
    const year = eventDate ? eventDate.getFullYear().toString() : "";
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return [slugTitle, city, month, year, randomSuffix].filter(Boolean).join("-");
  };

  const submitEvent = async (payloadData: SubmitPayload, isEditing: boolean, eventId?: string) => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to submit an event.");
      setIsSubmitting(false);
      return;
    }

    try {
      let finalPosterUrl = payloadData.previewUrl; // Fallback to existing
      
      if (payloadData.imageFile) {
        const { default: imageCompression } = await import("browser-image-compression");
        const compressedPoster = await imageCompression(payloadData.imageFile, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true, fileType: "image/webp" });
        const posterPresign = await fetch("/api/upload/presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: `events/poster_${Date.now()}.webp`, contentType: "image/webp", fileSize: compressedPoster.size }) });
        const { uploadUrl: posterUploadUrl, publicUrl: posterPublicUrl } = await posterPresign.json();
        await fetch(posterUploadUrl, { method: "PUT", headers: { "Content-Type": "image/webp" }, body: compressedPoster });
        finalPosterUrl = posterPublicUrl;
      }

      const eventCity = payloadData.is_virtual ? "online" : payloadData.location;
      
      // FIX: Add fallbacks to handle potential null or undefined values from DB types
      const uniqueSlug = generateSlug(
        payloadData.title || "", 
        eventCity || "", 
        payloadData.date_string ? new Date(payloadData.date_string) : undefined
      );

      // CORRECT — replace lines 5596–5610 with this:
      const { imageFile, previewUrl, is_featured, ...dbPayload } = payloadData;
      const finalPayload = { ...dbPayload };

      if (finalPosterUrl) finalPayload.poster_url = finalPosterUrl;

      // 1. Fetch profile data from your database (MOVED TO TOP LEVEL SCOPE)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, user_type, role")
        .eq("id", user.id)
        .single();

      // NEW: Auto-fetch and assign curator name if organizer_name is empty
      if (!finalPayload.organizer_name || String(finalPayload.organizer_name).trim() === "") {
        // 2. Extract name from Supabase/Google Auth metadata
        // Google usually stores this under 'name' or 'full_name'
        const authName = user.user_metadata?.full_name || user.user_metadata?.name;

        // 3. Fallback logic: Profile Name -> Google Name -> Profile Username -> Default
        finalPayload.organizer_name = 
          profile?.full_name || 
          authName || 
          profile?.username || 
          "Event Curator";
      }

      if (isEditing && eventId) {
        console.log("[useEventSubmit] Updating event with creator_id:", user.id);
        const { error } = await supabase.from("events").update(finalPayload).eq("id", eventId).eq("creator_id", user.id);
        
        if (error) throw error; // ← check error FIRST
        
        // Only runs if update succeeded:
        await supabase.from("event_reports")
          .update({ status: "resolved" })
          .eq("event_id", eventId)
          .eq("status", "pending");
          
      } else {
        // Check database role or fallback to environment admin email
         const isAdmin = profile?.user_type === 'admin' || profile?.role === 'admin' || user.email === 'eventime.admin@gmail.com' || user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        console.log("[useEventSubmit] Inserting new event with creator_id:", user.id);
        const { error } = await supabase.from("events").insert([{ 
          ...finalPayload, 
          slug: uniqueSlug, 
          creator_id: user.id,
          status: isAdmin ? "approved" : "pending" 
        }]);
        if (error) throw error;
      }
      
      router.push(isEditing ? `/profile` : `/events/${uniqueSlug}`);
    } catch (err) {
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitEvent };
}