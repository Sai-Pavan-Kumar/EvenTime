"use server";

import { revalidateTag, revalidatePath } from "next/cache";

export async function revalidateEventsCacheAction(slug?: string) {
  try {
    revalidateTag("events", "events");
    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidatePath("/search", "page");
    revalidatePath("/cities", "page");
    revalidatePath("/api/buffet");
    if (slug) {
      revalidateTag(`event_${slug}`, "events");
      revalidatePath(`/events/${slug}`, "page");
    }
  } catch (e) {
    console.error("[revalidateEventsCacheAction] Error:", e);
  }
}
