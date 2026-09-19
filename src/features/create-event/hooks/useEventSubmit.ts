import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitEventAction, type SubmitEventActionPayload } from "../actions";

type SubmitPayload = SubmitEventActionPayload & {
  imageFile?: File | null;
  previewUrl?: string | null;
};

export function useEventSubmit() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitEvent = async (payloadData: SubmitPayload, isEditing: boolean, eventId?: string) => {
    setIsSubmitting(true);
    try {
      let finalPosterUrl = payloadData.previewUrl || null;

      // 1. Handle image compression and R2 upload if a new file was provided
      if (payloadData.imageFile) {
        try {
          const { default: imageCompression } = await import("browser-image-compression");
          const compressedPoster = await imageCompression(payloadData.imageFile, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: "image/webp",
          });

          const posterPresign = await fetch("/api/upload/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: `events/poster_${Date.now()}.webp`,
              contentType: "image/webp",
              fileSize: compressedPoster.size,
            }),
          });

          if (!posterPresign.ok) {
            const presignErr = await posterPresign.json().catch(() => ({}));
            throw new Error(presignErr.error || "Failed to get image upload authorization");
          }

          const { uploadUrl: posterUploadUrl, publicUrl: posterPublicUrl } = await posterPresign.json();
          const uploadRes = await fetch(posterUploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "image/webp" },
            body: compressedPoster,
          });

          if (!uploadRes.ok) {
            throw new Error("Failed to upload image to storage");
          }

          finalPosterUrl = posterPublicUrl;
        } catch (imgErr: any) {
          console.error("[useEventSubmit] Image upload failed:", imgErr);
          toast.error("Image upload failed: " + (imgErr.message || "Please try without image or use a smaller file."));
          setIsSubmitting(false);
          return { success: false, error: imgErr };
        }
      }

      // 2. Destructure away client-only File/preview fields
      const { imageFile, previewUrl, ...serverPayload } = payloadData;
      if (finalPosterUrl) {
        serverPayload.poster_url = finalPosterUrl;
      }

      // 3. Strict 12-second failsafe race: guarantees the UI spinner never hangs indefinitely
      const timeoutPromise = new Promise<{ success: false; error: string }>((_, reject) =>
        setTimeout(() => reject(new Error("Server response timed out. Please check your connection.")), 12000)
      );

      const res = await Promise.race([
        submitEventAction(serverPayload, isEditing, eventId),
        timeoutPromise,
      ]);

      if (!res.success) {
        toast.error(res.error || "Submission failed. Please try again.");
        return { success: false, error: res.error };
      }

      // Cleanly clear draft storage upon successful creation
      try {
        localStorage.removeItem("@eventime_create_event_draft_v1");
      } catch {}

      if (isEditing) {
        toast.success("Event updated successfully!");
        router.push("/profile");
        return { success: true };
      }

      toast.success(
        res.status === "approved"
          ? "Event posted! It's live now."
          : "Event submitted! It'll go live once approved."
      );

      return {
        success: true,
        id: res.id,
        slug: res.slug,
        status: res.status,
        title: res.title,
        category: res.category,
        dateString: res.dateString,
        city: res.city,
        location: res.location,
        posterUrl: res.posterUrl,
        isTrusted: res.isTrusted,
      };
    } catch (err: any) {
      console.error("[useEventSubmit] Error:", err);
      const isDuplicateLink =
        err?.code === "23505" && err?.message?.includes("unique_registration_link");
      const isNetworkError =
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("network") ||
        err?.message?.includes("NetworkError") ||
        err?.message?.includes("connection") ||
        err?.message?.includes("timed out");

      toast.error(
        isDuplicateLink
          ? "This event link has already been posted by someone else."
          : isNetworkError
          ? "Network connection issue. Please check your internet and try again."
          : (err?.message || "Submission failed. Please try again.")
      );
      return { success: false, error: err };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitEvent };
}