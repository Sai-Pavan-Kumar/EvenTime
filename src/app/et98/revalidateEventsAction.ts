"use server";

import { revalidateTag, revalidatePath } from "next/cache";

export async function revalidateEventsCacheAction(slug?: string) {
  try {
    (revalidateTag as any)("events", "events");
    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidatePath("/search", "page");
    revalidatePath("/cities", "page");
    if (slug) {
      (revalidateTag as any)(`event_${slug}`, `event_${slug}`);
      revalidatePath(`/events/${slug}`, "page");
    }
  } catch (e) {
    console.error("[revalidateEventsCacheAction] Error:", e);
  }
}
