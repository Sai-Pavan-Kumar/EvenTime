import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Event titles are user-written. A raw "</script>" inside JSON-LD would close the tag
// and let the rest run as HTML, so "<" is escaped to its JSON unicode form.
export function toJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
