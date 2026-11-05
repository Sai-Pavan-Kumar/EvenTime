import { fetchPriceOptions } from "@/lib/eventPrice";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/features/create-event/utils/validateEventPayload";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { CreateEventForm } from "@/features/create-event/CreateEventForm";

// We will build the modified CreateEventForm to handle edits in the next step
export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const isAdmin = await requireAdmin(supabase, user.id);
  // Row rules can hide other curators' pending events, so admins read after the check above.
  const eventsClient = isAdmin ? createAdminClient() : supabase;
  const { data: event } = await eventsClient
    .from("events")
    .select("id, slug, title, category, organizer_name, description, target_audience, date_string, start_time, end_date_string, end_time, location, city, is_virtual, is_free, price, registration_link, prizes, team_size, website, is_featured, registration_deadline, poster_url, creator_id, college_branch, college_year, college_only, college_id, colleges(name), status")
    .eq(isUuid(slug) ? "id" : "slug", slug)
    .maybeSingle() as any;

  if (!event) notFound();
  if (!isAdmin && event.creator_id !== user.id) return <div className="text-center p-20 font-bold text-red-500">You don't have permission to edit this event.</div>;

  // Inside your EditEventPage return
return (
  <main className="min-h-screen bg-slate-50/50">
    <Navbar />
    <div className="py-12 px-4 sm:px-6">
      <CreateEventForm initialData={{ ...event, ...(await fetchPriceOptions(eventsClient, event.id)) }} isEditing={true} />
    </div>
  </main>
);
}