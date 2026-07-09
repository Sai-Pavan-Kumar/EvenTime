"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireAdmin } from "@/lib/auth/permissions";

async function verifyAdmin(supabase: SupabaseClient<Database>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  return requireAdmin(supabase, user.id);
}

export async function approveEventAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized. Security breach logged.");

  const eventId = formData.get("eventId") as string;
  if (!eventId) return { error: "Missing eventId." };

  // Derive creator server-side — never trust client
  const { data: event } = await supabase
    .from("events")
    .select("creator_id")
    .eq("id", eventId)
    .single();

  if (!event?.creator_id) return { error: "Event not found." };

  const adminClient = createAdminClient();
  const { error: eventError } = await adminClient
    .from("events")
    .update({ status: "approved" })
    .eq("id", eventId);

  if (eventError) return { error: "Event update failed" };

  const { error: profileError } = await adminClient.rpc('award_event_approval_score', {
    p_user_id: event.creator_id,
    p_event_id: eventId
  });

  if (profileError) return { error: "Score update failed" };

  revalidatePath("/", "layout"); 
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  return { success: true };
}

export async function rejectEventAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized. Security breach logged.");

  const eventId = formData.get("eventId") as string;
  const reason = formData.get("reason") as string | null;

  const { data: event } = await supabase
    .from("events")
    .select("creator_id, title")
    .eq("id", eventId)
    .single();

  if (!event?.creator_id) return { error: "Event not found." };

  const adminClient = createAdminClient();
  const { error: eventError } = await adminClient
    .from("events")
    .update({ status: "rejected" })
    .eq("id", eventId);

  revalidatePath("/", "layout"); 
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, creatorId: event.creator_id, title: event.title };
}
export async function resolveReportAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized. Security breach logged.");

  const reportId = formData.get("reportId") as string;

  await supabase.from("event_reports").update({ status: "dismissed" }).eq("id", reportId);

  revalidatePath("/admin");
  return { success: true };
}

export async function punishCuratorAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized. Security breach logged.");

  const reportId = formData.get("reportId") as string;
  if (!reportId) return { error: "Missing reportId." };

  // Derive curator and event from the report — never trust client
  const { data: report } = await supabase
    .from("event_reports")
    .select("curator_id, event_id")
    .eq("id", reportId)
    .single();

  if (!report?.curator_id || !report?.event_id) return { error: "Report not found." };

  await supabase.from("event_reports").update({ status: "resolved" }).eq("id", reportId);

  // PLAN RULE: -150 penalty only fires if 5+ DIFFERENT reporters (each with
  // et_score >= 150, so new/fake accounts can't trigger it) reported this event.
  const { data: allReports } = await supabase
    .from("event_reports")
    .select("reporter_id, reporter:profiles!event_reports_reporter_id_fkey(et_score)")
    .eq("event_id", report.event_id);

  const trustedReporterIds = new Set(
    (allReports || [])
      .filter((r: any) => (r.reporter?.et_score ?? 0) >= 150 && r.reporter_id)
      .map((r: any) => r.reporter_id)
  );

  if (trustedReporterIds.size < 5) {
    revalidatePath("/admin");
    return { success: true, note: "Marked resolved, but penalty needs 5+ trusted reporters (currently " + trustedReporterIds.size + ")." };
  }

  await supabase.rpc('increment_et_score', {
    user_id: report.curator_id,
    delta: -150
  });

  revalidatePath("/admin");
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteEventAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized.");

  const eventId = formData.get("eventId") as string;
  if (!eventId) return { error: "Missing eventId." };

  const adminClient = createAdminClient();
  // Soft Delete: Just update the status to 'deleted'
  const { data: deleted, error } = await adminClient.from("events").update({ status: "deleted" }).eq("id", eventId).select();
  if (error) throw new Error("Delete failed: " + error.message);
  if (!deleted || deleted.length === 0) throw new Error("Action Blocked: Check Supabase RLS Policies.");
  
  revalidatePath("/", "layout"); 
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  return { success: true };
}

export async function deleteUserAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized.");

  const userId = formData.get("userId") as string;
  if (!userId) return { error: "Missing userId." };

  // Soft delete: mark the row, then ban login immediately.
  // Real removal happens after 30 days via the purge_old_deleted_users() DB job.
  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: "Failed to delete user." };

  const adminClient = createAdminClient();
  await adminClient.auth.admin.updateUserById(userId, { ban_duration: "876000h" }); // ~100 years, effectively until purge

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserRoleAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized.");

  const userId = formData.get("userId") as string;
  const newRole = formData.get("role") as string;
  
  if (!userId || !newRole) return { error: "Missing required fields." };

  const adminClient = createAdminClient();
  await adminClient.from("profiles").update({ role: newRole }).eq("id", userId);
  
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateEventDetailsAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized.");

  const eventId = formData.get("eventId") as string;
  const category = formData.get("category") as string;
  const newStatus = formData.get("status") as string;
  
  if (!eventId) return { error: "Missing eventId." };

  const { data: event } = await supabase
    .from("events")
    .select("status, creator_id")
    .eq("id", eventId)
    .single();

  if (!event) return { error: "Event not found." };

  const adminClient = createAdminClient();
  const { data: updated, error: updateError } = await adminClient.from("events").update({ category, status: newStatus }).eq("id", eventId).select();
  if (updateError) throw new Error("Update failed: " + updateError.message);
  if (!updated || updated.length === 0) throw new Error("Action Blocked: Check Supabase RLS Policies.");
  
  // Award points if manually changed to approved, deduct if reverted
  if (newStatus === "approved" && event.status !== "approved" && event.creator_id) {
    await supabase.rpc('award_event_approval_score', { p_user_id: event.creator_id, p_event_id: eventId });
  } else if (event.status === "approved" && newStatus !== "approved" && event.creator_id) {
    await supabase.rpc('increment_et_score', { user_id: event.creator_id, delta: -50 });
  }
  revalidatePath("/");
  revalidatePath("/", "layout"); 
  revalidatePath("/cities/[city]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  return { success: true };
}

export async function toggleLeaderboardAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized.");

  const enabled = formData.get("enabled") === "true";

  const { error } = await supabase.from("app_settings").update({ leaderboard_enabled: enabled }).eq("id", 1);
  if (error) {
    console.error("Toggle leaderboard failed:", error);
    return { error: "Failed to update setting." };
  }

  revalidatePath("/admin");

  revalidatePath("/");
  revalidatePath("/leaderboard");
  return { success: true };
}

export async function toggleFeaturedAction(formData: FormData) {
  const supabase = await createClient();
  const isAdmin = await verifyAdmin(supabase);
  if (!isAdmin) throw new Error("Unauthorized.");

  const eventId = formData.get("event_id") as string;
  const isFeatured = formData.get("is_featured") === "true";

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("events").update({ is_featured: isFeatured }).eq("id", eventId);
  if (error) {
    console.error("Toggle featured failed:", error);
    return { error: "Failed to update featured status." };
  }
  revalidatePath("/", "layout"); 
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}