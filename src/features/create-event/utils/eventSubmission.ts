export interface SubmitEventActionPayload {
  title: string;
  category: string;
  organizer_name?: string | null;
  description?: string | null;
  target_audience?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
  end_date_string?: string | null;
  date_string: string;
  location?: string | null;
  city?: string | null;
  is_virtual?: boolean | null;
  is_free?: boolean | null;
  price?: number | null;
  price_currency?: string | null;
  price_is_starting?: boolean | null;
  registration_link?: string | null;
  prizes?: string | null;
  team_size?: string | null;
  website?: string | null;
  is_featured?: boolean | null;
  status?: string | null;
  registration_deadline?: string | null;
  branch_tags?: string[] | null;
  college_branch?: string | null;
  college_year?: string | null;
  college_only?: boolean | null;
  college_id?: string | null;
  poster_url?: string | null;
  // Generated once per form, so a retry after a timeout can't post the same event twice.
  submission_id?: string | null;
}

export type SubmitEventActionResult =
  | {
      success: true;
      id: string;
      slug?: string;
      status: "approved" | "pending";
      title: string;
      category: string;
      dateString: string;
      city: string;
      location?: string;
      posterUrl?: string | null;
      isTrusted?: boolean;
      isEditing?: boolean;
    }
  | {
      success: false;
      error: string;
    };

export function withProtocol(link?: string | null) {
  const clean = link?.trim();
  if (!clean) return null;
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

export function isOwnPosterUrl(url: string) {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  return Boolean(base && url.startsWith(`${base}/`));
}

export function buildSlug(title: string, city: string, dateString: string) {
  const slugPart = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toLowerCase();
  const suffix = crypto.randomUUID().slice(0, 4);
  return [slugPart(title), slugPart(city.split(",")[0]), month, date.getUTCFullYear().toString(), suffix].filter(Boolean).join("-");
}
