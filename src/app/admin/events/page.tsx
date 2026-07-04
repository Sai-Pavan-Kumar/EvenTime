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

  let query = supabase.from("events").select(`
    id, slug, title, category, poster_url, status,
    profiles ( full_name )
  `);

  if (filter === "pending") query = query.eq("status", "pending");
  else if (filter === "approved") query = query.eq("status", "approved");
  else if (filter === "rejected") query = query.eq("status", "rejected");
  else if (filter === "deleted") query = query.eq("status", "deleted");
  else query = query.neq("status", "deleted");

  const { data: events, error } = await query;

  if (error) {
    console.error("Error fetching events:", error.message || JSON.stringify(error));
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateEventDetailsAction(formData);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    await deleteEventAction(formData);
  }

  return (
    <div className="px-10 pb-12 max-w-[1400px] mx-auto space-y-10 pt-4">
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-['Outfit'] font-bold text-[#0D0D1A] tracking-[-1px]">Event Management</h1>
          <p className="text-[15px] text-[#555570] font-['Switzer'] mt-1">Review, approve, and manage all platform events.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        <Link href="/admin/events" className={`px-6 py-3 rounded-full text-[14px] font-bold font-['Outfit'] transition-all whitespace-nowrap ${filter === "all" ? "bg-[#0D0D1A] text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]" : "bg-[#FFFFFF] text-[#555570] hover:bg-[#F0F0F8] hover:text-[#0D0D1A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"}`}>
          All Events
        </Link>
        <Link href="/admin/events?filter=pending" className={`px-6 py-3 rounded-full text-[14px] font-bold font-['Outfit'] transition-all whitespace-nowrap ${filter === "pending" ? "bg-[#F59E0B] text-white shadow-[0_4px_16px_rgba(245,158,11,0.2)]" : "bg-[#FFFFFF] text-[#555570] hover:bg-[#F0F0F8] hover:text-[#0D0D1A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"}`}>
          Pending
        </Link>
        <Link href="/admin/events?filter=approved" className={`px-6 py-3 rounded-full text-[14px] font-bold font-['Outfit'] transition-all whitespace-nowrap ${filter === "approved" ? "bg-[#22C55E] text-white shadow-[0_4px_16px_rgba(34,197,94,0.2)]" : "bg-[#FFFFFF] text-[#555570] hover:bg-[#F0F0F8] hover:text-[#0D0D1A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"}`}>
          Approved
        </Link>
        <Link href="/admin/events?filter=rejected" className={`px-6 py-3 rounded-full text-[14px] font-bold font-['Outfit'] transition-all whitespace-nowrap ${filter === "rejected" ? "bg-[#EF4444] text-white shadow-[0_4px_16px_rgba(239,68,68,0.2)]" : "bg-[#FFFFFF] text-[#555570] hover:bg-[#F0F0F8] hover:text-[#0D0D1A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"}`}>
          Rejected
        </Link>
        <Link href="/admin/events?filter=deleted" className={`px-6 py-3 rounded-full text-[14px] font-bold font-['Outfit'] transition-all whitespace-nowrap ${filter === "deleted" ? "bg-[#555570] text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]" : "bg-[#FFFFFF] text-[#555570] hover:bg-[#F0F0F8] hover:text-[#0D0D1A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"}`}>
          Trash
        </Link>
      </div>

      {/* Data Table Container */}
      <div className="bg-[#FFFFFF] rounded-[32px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFFFFF] border-b border-black/[0.04]">
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">Event Details</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">Creator</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">Category</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">Status</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {events && events.length > 0 ? (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    
                    {/* Event Image & Title */}
                    <td className="px-8 py-6">
                      <form id={`update-${event.id}`} action={handleUpdate}>
                        <input type="hidden" name="eventId" value={event.id} />
                      </form>
                      <div className="flex items-center gap-5">
                        <div className="w-[88px] h-[56px] rounded-[16px] bg-[#F5F5F7] overflow-hidden shrink-0 relative">
                          {event.poster_url ? (
                            <Image src={event.poster_url} alt={event.title || "Event Poster"} fill sizes="88px" className="object-cover" />
                          ) : (
                            <Image src="/window.svg" alt="Default Poster" fill sizes="88px" className="object-cover" />
                          )}
                        </div>
                        <div>
                          <Link href={`/events/${event.slug || event.id}`} target="_blank" className="hover:text-[#6C47FF] transition-colors group/title">
                            <p className="font-bold text-[#0D0D1A] font-['Outfit'] text-[18px] group-hover/title:text-[#6C47FF] leading-tight line-clamp-1 max-w-[300px]">{event.title || "Untitled Event"}</p>
                          </Link>
                          <p className="text-[12px] font-bold text-[#9999B0] mt-1.5 uppercase tracking-wider font-['Outfit']">ID: {event.id?.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>

                    {/* Creator Info */}
                    <td className="px-8 py-6">
                      <span className="text-[15px] font-medium font-['Switzer'] text-[#555570]">
                        {(event.profiles as any)?.full_name || "Unknown User"}
                      </span>
                    </td>

                    {/* Category (Editable) */}
                    <td className="px-8 py-6">
                      <input 
                        type="text" 
                        name="category" 
                        defaultValue={event.category || ""} 
                        form={`update-${event.id}`} 
                        placeholder="Category"
                        className="text-[12px] font-bold text-[#6C47FF] bg-transparent border-b-2 border-dashed border-transparent hover:border-[#B29DFF] focus:border-[#6C47FF] px-2 py-1.5 uppercase tracking-wider w-36 outline-none transition-colors font-['Outfit']"
                      />
                    </td>

                    {/* Status (Editable) */}
                    <td className="px-8 py-6">
                      <StatusSelect eventId={event.id} initialStatus={event.status || "pending"} />
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-3">
                        <button type="submit" form={`update-${event.id}`} className="w-[44px] h-[44px] rounded-full bg-[#F5F5F7] text-[#9999B0] flex items-center justify-center hover:bg-[#22C55E] hover:text-white transition-colors" title="Save Changes">
                          <CheckCircle className="w-5 h-5" />
                        </button>

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
                  <td colSpan={5} className="px-8 py-24 text-center text-[#9999B0] font-bold uppercase tracking-widest text-[13px] font-['Outfit']">
                    No events found in this category
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}