import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TablesInsert } from "@/types/database";
import { toast } from "sonner";
import { revalidateEventsCacheAction } from "@/app/et98/revalidateEventsAction";
import { isVerifiedDomain } from "@/lib/constants/verifiedDomains";
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
    const city = eventLocation? eventLocation.split(",")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""): "online";
    const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const month = eventDate ? monthNames[eventDate.getMonth()] : "";
    const year = eventDate ? eventDate.getFullYear().toString() : "";
    const randomSuffix = crypto.randomUUID().split("-")[0].substring(0, 4);
    return [slugTitle, city, month, year, randomSuffix].filter(Boolean).join("-");
  };

  const submitEvent = async (payloadData: SubmitPayload, isEditing: boolean, eventId?: string) => {
    setIsSubmitting(true);
    try {
      // 1. Instant check from local session/cookies (0ms latency, eliminates auth check timeout)
      let user = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData?.session?.user || null;
      } catch (sessionErr) {
        console.warn("[useEventSubmit] getSession warning:", sessionErr);
      }

      // 2. Fallback to getUser() if session was null
      if (!user) {
        try {
          const userRes = await Promise.race([
            supabase.auth.getUser(),
            new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
              setTimeout(() => reject(new Error("Authentication check timed out")), 10000)
            )
          ]);
          user = userRes?.data?.user || null;
        } catch (authErr) {
          console.warn("[useEventSubmit] getUser fallback warning:", authErr);
        }
      }

      if (!user) {
        toast.error("Please login to submit an event.");
        return;
      }

      let finalPosterUrl = payloadData.previewUrl; // Fallback to existing
      
      if (payloadData.imageFile) {
        const { default: imageCompression } = await import("browser-image-compression");
        const compressedPoster = await imageCompression(payloadData.imageFile, { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true, fileType: "image/webp" });
        const posterPresign = await fetch("/api/upload/presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: `events/poster_${Date.now()}.webp`, contentType: "image/webp", fileSize: compressedPoster.size }) });
        const { uploadUrl: posterUploadUrl, publicUrl: posterPublicUrl } = await posterPresign.json();
        await fetch(posterUploadUrl, { method: "PUT", headers: { "Content-Type": "image/webp" }, body: compressedPoster });
        finalPosterUrl = posterPublicUrl;
      }

      const eventCity = payloadData.is_virtual ? "online" : (payloadData.city || payloadData.location || "online");
      
      // FIX: Add fallbacks to handle potential null or undefined values from DB types
      const uniqueSlug = generateSlug(
        payloadData.title || "", 
        eventCity || "", 
        payloadData.date_string ? new Date(payloadData.date_string) : undefined
      );

      // Destructure only UI fields, let is_featured go into the database payload
      const { imageFile, previewUrl, ...dbPayload } = payloadData;
      const finalPayload = { ...dbPayload };
       // FIX: Convert empty strings to null for link fields to prevent Postgres CHECK constraint failures
      if (finalPayload.registration_link === "") finalPayload.registration_link = null;
      if (finalPayload.website === "") finalPayload.website = null;

      if (finalPosterUrl) finalPayload.poster_url = finalPosterUrl;

      // 1. Fetch profile data with 4s timeout
      let profile: any = null;
      try {
        const profileRes = await Promise.race([
          supabase.from("profiles").select("full_name, username, user_type, role").eq("id", user.id).single(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Profile query timeout")), 4000))
        ]);
        profile = profileRes?.data;
      } catch (profileErr) {
        console.warn("[useEventSubmit] Profile fetch warning, using fallback:", profileErr);
      }

      // NEW: Auto-fetch and assign curator name if organizer_name is empty
      if (!finalPayload.organizer_name || String(finalPayload.organizer_name).trim() === "") {
        // 2. Extract name from Supabase/Google Auth metadata
        const authName = user.user_metadata?.full_name || user.user_metadata?.name;

        // 3. Fallback logic: Profile Name -> Google Name -> Profile Username -> Default
        finalPayload.organizer_name = 
          profile?.full_name || 
          authName || 
          profile?.username || 
          "Event Curator";
      }

      let finalStatus: string | null = null;
      let insertedId: string | undefined = undefined;

      if (isEditing && eventId) {
        insertedId = eventId;
        const updateRes = await Promise.race([
          supabase.from("events").update(finalPayload).eq("id", eventId).eq("creator_id", user.id),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Event update timed out")), 20000))
        ]);
        
        if (updateRes.error) throw updateRes.error;
        
        await supabase.from("event_reports")
          .update({ status: "resolved" })
          .eq("event_id", eventId)
          .eq("status", "pending");
          
      } else {
        const isAdmin = profile?.user_type === 'admin' || profile?.role === 'admin';
        const isTrustedLink = isVerifiedDomain(finalPayload.registration_link);
        finalStatus = isAdmin || isTrustedLink ? "approved" : (finalPayload.status || "pending");
        
        const insertRes = await Promise.race([
          supabase.from("events").insert([{
            ...finalPayload, 
            slug: uniqueSlug, 
            creator_id: user.id,
            status: finalStatus 
          }]).select("id"),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Event submission timed out")), 20000))
        ]);
        
        if (insertRes.error) throw insertRes.error;
        insertedId = insertRes.data?.[0]?.id;
        
        // Background cache revalidation without blocking UI
        if (finalStatus === "approved") {
          void revalidateEventsCacheAction(uniqueSlug).catch((err) => {
            console.error("[useEventSubmit] Cache revalidation warning:", err);
          });
        }
      }
      
      toast.success(
        isEditing
          ? "Event updated!"
          : finalStatus === "approved"
          ? "Event posted! It's live now."
          : "Event submitted! It'll go live once approved."
      );
      try { localStorage.removeItem("@eventime_create_event_draft_v1"); } catch {}
      if (isEditing) {
        router.push("/profile");
      }
      return {
        success: true,
        id: insertedId,
        slug: uniqueSlug,
        status: (finalStatus || "approved") as "approved" | "pending",
        title: finalPayload.title || "",
        category: finalPayload.category || "",
        dateString: finalPayload.date_string || "",
        city: finalPayload.city || "",
        location: finalPayload.location || "",
        posterUrl: finalPosterUrl || null,
      };
    } catch (err: any) {
      console.error("[useEventSubmit] Error:", err);
      const isDuplicateLink = err?.code === "23505" && err?.message?.includes("unique_registration_link");
      toast.error(
        isDuplicateLink
          ? "This event link has already been posted by someone else."
          : (err?.message || "Submission failed. Please try again.")
      );
      return { success: false, error: err };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitEvent };
}