"use server";

import { revalidateTag } from "next/cache";

export async function revalidateEventsCacheAction() {
  revalidateTag("events", "events");
}