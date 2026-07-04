import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle, Users, AlertTriangle, ShieldAlert, BarChart3, Ticket, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { approveEventAction, rejectEventAction, resolveReportAction, punishCuratorAction, toggleLeaderboardAction, toggleFeaturedAction } from "./actions";
import { requireAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

type ReportWithEvent = {
  id: string;
  reason: string;
  status: string | null;
  created_at: string;
  curator_id: string | null;
  events: { title: string } | null;
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isAdmin = await requireAdmin(supabase, user.id);
  if (!isAdmin) {
    redirect("/");
  }

  // Server Actions
  async function handleApprove(formData: FormData) { "use server"; await approveEventAction(formData); }
  async function handleReject(formData: FormData) { "use server"; await rejectEventAction(formData); }
  async function handleResolve(formData: FormData) { "use server"; await resolveReportAction(formData); }
  async function handlePunish(formData: FormData) { "use server"; await punishCuratorAction(formData); }
  async function handleToggleLeaderboard(formData: FormData) { "use server"; await toggleLeaderboardAction(formData); }
  async function handleToggleFeatured(formData: FormData) { "use server"; await toggleFeaturedAction(formData); }

  // Fetch Data
  const [
    { count: totalUsers },
    { count: totalEvents },
    { data: appSettings },
    { data: pendingEvents },
    { data: activeReports }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("app_settings").select("leaderboard_enabled, featured_enabled").eq("id", 1).maybeSingle(),
    supabase.from("events").select("id, slug, title, category, poster_url, created_at, profiles:creator_id ( full_name )").eq("status", "pending").order("created_at", { ascending: false }).limit(10),
    supabase.from("event_reports").select("id, reason, status, created_at, curator_id, events ( title )").eq("status", "pending").order("created_at", { ascending: false }).limit(5)
  ]);

  const leaderboardEnabled = appSettings?.leaderboard_enabled ?? true;
  const featuredEnabled = appSettings?.featured_enabled ?? true;
  const reports = activeReports as unknown as ReportWithEvent[];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-['Outfit'] font-black text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Monitor your platform metrics and moderation queues.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <form action={handleToggleLeaderboard}>
            <input type="hidden" name="enabled" value={(!leaderboardEnabled).toString()} />
            <button type="submit" className={`relative flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border transition-all ${leaderboardEnabled ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
              <div className={`w-2 h-2 rounded-full ${leaderboardEnabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300"}`} />
              Leaderboard
            </button>
          </form>
          
          <form action={handleToggleFeatured}>
            <input type="hidden" name="enabled" value={(!featuredEnabled).toString()} />
            <button type="submit" className={`relative flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border transition-all ${featuredEnabled ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
              <div className={`w-2 h-2 rounded-full ${featuredEnabled ? "bg-[#6C47FF] shadow-[0_0_8px_rgba(108,71,255,0.5)]" : "bg-slate-300"}`} />
              Featured System
            </button>
          </form>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "+12%" },
          { label: "Total Events", value: totalEvents || 0, icon: Ticket, color: "text-indigo-600", bg: "bg-indigo-50", trend: "+8%" },
          { label: "Pending Approvals", value: pendingEvents?.length || 0, icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50", trend: "-2%" },
          { label: "Active Reports", value: reports?.length || 0, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50", trend: "0%" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-slate-400'}`}>
                {stat.trend.startsWith('+') && <TrendingUp className="w-3 h-3" />}
                {stat.trend}
              </span>
            </div>
            <h3 className="text-3xl font-black font-['Outfit'] text-slate-900 tracking-tight">{stat.value}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: EVENTS QUEUE (Takes 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-['Outfit'] font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-slate-400" />
                Event Approval Queue
              </h2>
              <Link href="/admin/events" className="text-xs font-bold text-[#6C47FF] hover:text-[#5835e5] transition-colors">View All</Link>
            </div>
            
            <div className="divide-y divide-slate-100">
              {pendingEvents && pendingEvents.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">Event</th>
                      <th className="px-5 py-3 font-semibold">Organizer</th>
                      <th className="px-5 py-3 font-semibold">Date Submitted</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                              <Image src={event.poster_url || "/window.svg"} alt="Poster" fill sizes="40px" className="object-cover" />
                            </div>
                            <div>
                              <Link href={`/events/${event.slug || event.id}`} target="_blank" className="font-bold text-sm text-slate-900 hover:text-[#6C47FF] transition-colors line-clamp-1">
                                {event.title}
                              </Link>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{event.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-600">
                          {(event.profiles as any)?.full_name || "Unknown"}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                          {event.created_at ? new Date(event.created_at as string).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <form action={handleApprove}>
                              <input type="hidden" name="eventId" value={event.id ?? ""} />
                              <button type="submit" className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors tooltip-trigger" title="Approve">
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </form>
                            <form action={handleReject}>
                              <input type="hidden" name="eventId" value={event.id} />
                              <button type="submit" className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors tooltip-trigger" title="Reject">
                                <XCircle className="w-5 h-5" />
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">All caught up</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">No events waiting for approval.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MODERATION (Takes 1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-['Outfit'] font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                Moderation Queue
              </h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div key={report.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 mb-2 border border-red-100">
                          {report.reason}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{report.events?.title || "Unknown Event"}</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{new Date(report.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <form action={handleResolve}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <button type="submit" className="w-full py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                          Dismiss
                        </button>
                      </form>
                      <form action={handlePunish}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <button type="submit" className="w-full py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-md text-[11px] font-bold hover:bg-red-100 transition-colors">
                          Punish
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <ShieldAlert className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">No active reports</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Community is safe and clean.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}