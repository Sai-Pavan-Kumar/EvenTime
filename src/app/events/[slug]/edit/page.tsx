import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { CreateEventForm } from "@/features/create-event/CreateEventForm";

// We will build the modified CreateEventForm to handle edits in the next step
export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title, category, description, target_audience, date_string, start_time, end_date_string, end_time, location, city, is_virtual, is_free, price, registration_link, prizes, team_size, website, is_featured, registration_deadline, poster_url, creator_id, college_branch, college_year, college_only, college_id, colleges(name), status")
    .eq("slug", slug)
    .single() as any;

  if (!event) return <div className="text-center p-20 font-bold text-xl">Event not found.</div>;
  if (event.creator_id !== user.id) return <div className="text-center p-20 font-bold text-red-500">You don't have permission to edit this event.</div>;

  // Inside your EditEventPage return
return (
  <main className="min-h-screen bg-[#F8F9FB] py-12 px-6">
    <Navbar />
    {/* Clean Apple-style Header */}
    <div className="max-w-2xl mx-auto mb-10">
       <h1 className="text-3xl font-bold text-slate-900">Edit Event</h1>
       <p className="text-slate-500">Update your event details to keep your audience informed.</p>
    </div>
    
    <CreateEventForm initialData={event} isEditing={true} />
  </main>
);
}