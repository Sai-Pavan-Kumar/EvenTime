import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trash2, CheckCircle, XCircle, ImageIcon, Save } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { deleteEventAction, updateEventDetailsAction } from "../actions";
import { DeleteConfirmButton } from "./DeleteConfirmButton";
import { StatusSelect } from "./StatusSelect";

export const dynamic = "force-dynamic";

// Next.js 15+ standard for page props
type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AdminEventsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const filter = searchParams.filter || "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = await requireAdmin(supabase, user.id);
  if (!isAdmin) redirect("/");

  // Fetch events based on the filter. 
  // We specify exact columns to prevent the empty object {} crash.
  let query = supabase.from("events").select(`
    id, slug, title, category, poster_url, status,
    profiles ( full_name )
  `);

  if (filter === "pending") query = query.eq("status", "pending");
  else if (filter === "approved") query = query.eq("status", "approved");
  else if (filter === "rejected") query = query.eq("status", "rejected");
  else if (filter === "deleted") query = query.eq("status", "deleted");
  else query = query.neq("status", "deleted"); // Explicitly hides trash from the "All" tab

  const { data: events, error } = await query;

  if (error) {
    console.error("Error fetching events:", error.message || JSON.stringify(error));
  }

  // Wrapper functions for server actions
  async function handleUpdate(formData: FormData) {
    "use server";
    await updateEventDetailsAction(formData);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    await deleteEventAction(formData);
  }

    return (
    <div className="w-full">
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-['Outfit'] tracking-[-0.02em] font-black text-slate-900">Event Management</h1>
            <p className="text-slate-500 font-medium mt-1">Review, approve, and manage all platform events.</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Link href="/admin/events" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === "all" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-500 hover:bg-slate-100"}`}>
            All Events
          </Link>
          <Link href="/admin/events?filter=pending" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === "pending" ? "bg-[#6C47FF] text-white shadow-[0_4px_16px_rgba(108,71,255,0.2)]" : "bg-white text-slate-500 hover:bg-slate-100"}`}>
            Pending
          </Link>
          <Link href="/admin/events?filter=approved" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === "approved" ? "bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.2)]" : "bg-white text-slate-500 hover:bg-slate-100"}`}>
            Approved
          </Link>
          <Link href="/admin/events?filter=rejected" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === "rejected" ? "bg-red-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.2)]" : "bg-white text-slate-500 hover:bg-slate-100"}`}>
            Rejected
          </Link>
          <Link href="/admin/events?filter=deleted" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === "deleted" ? "bg-slate-800 text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]" : "bg-white text-slate-500 hover:bg-slate-100"}`}>
            Trash
          </Link>
        </div>

        {/* Data Table Container */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Event Details</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Creator</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events && events.length > 0 ? (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Event Image & Title */}
                      <td className="px-6 py-4">
                        <form id={`update-${event.id}`} action={handleUpdate}>
                          <input type="hidden" name="eventId" value={event.id} />
                        </form>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                            {event.poster_url ? (
                              <Image src={event.poster_url} alt={event.title || "Event Poster"} fill sizes="64px" className="object-cover" />
                            ) : (
                              <Image src="/window.svg" alt="Default Poster" fill sizes="64px" className="object-cover" />
                            )}
                          </div>
                          <div>
                            <Link href={`/events/${event.slug || event.id}`} target="_blank" className="hover:text-[#6C47FF] transition-colors group/title">
                              <p className="font-bold text-slate-900 group-hover/title:text-[#6C47FF] leading-tight line-clamp-1 max-w-[300px]">{event.title || "Untitled Event"}</p>
                            </Link>
                            <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">ID: {event.id?.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>

                      {/* Creator Info */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {(event.profiles as any)?.full_name || "Unknown User"}
                        </span>
                      </td>

                      {/* Category (Editable) */}
                      <td className="px-6 py-4">
                        <input 
                          type="text" 
                          name="category" 
                          defaultValue={event.category || ""} 
                          form={`update-${event.id}`} 
                          placeholder="Category"
                          className="text-xs font-bold text-[#6C47FF] bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#6C47FF] px-1 py-1 uppercase tracking-wider w-32 outline-none transition-colors"
                        />
                      </td>

                      {/* Status (Editable) */}
                      <td className="px-6 py-4">
                        <StatusSelect eventId={event.id} initialStatus={event.status || "pending"} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          
                          <button type="submit" form={`update-${event.id}`} className="p-2 bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100 rounded-lg transition-colors" title="Save Changes">
                            <CheckCircle className="w-5 h-5" />
                          </button>

                          {/* Delete Button */}
                          <form action={handleDelete}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <DeleteConfirmButton />
                          </form>

                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No events found in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}