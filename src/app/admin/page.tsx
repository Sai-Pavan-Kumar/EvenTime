import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { CheckCircle, XCircle, Users, AlertTriangle, ShieldAlert, BarChart3, Building2, CalendarDays, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { approveEventAction, rejectEventAction, resolveReportAction, punishCuratorAction } from "./actions";
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
    console.log("Unauthorized access attempt by user ID:", user?.id);
    redirect("/");
  }

  // Wrapper functions to fix the TypeScript return type error
  async function handleApprove(formData: FormData) {
    "use server";
    await approveEventAction(formData);
  }

  async function handleReject(formData: FormData) {
    "use server";
    await rejectEventAction(formData);
  }

  async function handleResolve(formData: FormData) {
    "use server";
    await resolveReportAction(formData);
  }

  async function handlePunish(formData: FormData) {
    "use server";
    await punishCuratorAction(formData);
  }

  // 1. Fetch Global Dashboard Analytics
  const [
    { count: totalUsers },
    { count: totalEvents },
    { data: collegesData },
    { data: platformFeedback }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("college").not("college", "is", null),
    supabase.from("platform_feedback").select("id, type, message, created_at, profiles:user_id(full_name)").order("created_at", { ascending: false }).limit(20)
  ]);

  // Calculate top performing colleges
  const collegeCounts = collegesData?.reduce((acc: Record<string, number>, profile) => {
    if (profile.college) {
      acc[profile.college] = (acc[profile.college] || 0) + 1;
    }
    return acc;
  }, {}) || {};
  
  const topColleges = Object.entries(collegeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // 2. Fetch Pending Events
  const { data: pendingEvents } = await supabase
    .from("events")
    .select("id, slug, title, category, poster_url, creator_id, profiles:creator_id ( full_name )")
    .eq("status", "pending") 
    .order("created_at", { ascending: false });

  // 3. Fetch Active Reports with proper TypeScript typing
  const { data: activeReports, error: reportsError } = await supabase
    .from("event_reports")
    .select(`
      id,
      reason,
      status,
      created_at,
      curator_id,
      events ( title )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false }) as { data: ReportWithEvent[] | null, error: unknown };

  if (reportsError) {
    console.error("Fetch Reports Error:", reportsError);
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-['Outfit'] tracking-[-0.02em] font-black text-slate-900">Admin Control</h1>
          <p className="text-slate-500 font-medium">Manage event quality and community trust.</p>
        </div>

        {/* Stats Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Global Users */}
          <Link href="/admin/users" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md hover:ring-2 hover:ring-blue-500/20 transition-all cursor-pointer">
            <Users className="w-6 h-6 text-blue-500 mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Users</p>
            <h2 className="text-4xl font-['Outfit'] tracking-[-0.02em] font-black text-slate-900 mt-2">{totalUsers || 0}</h2>
          </Link>

          {/* Global Events */}
          <Link href="/admin/events" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md hover:ring-2 hover:ring-emerald-500/20 transition-all cursor-pointer">
            <CalendarDays className="w-6 h-6 text-emerald-500 mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Events</p>
            <h2 className="text-4xl font-['Outfit'] tracking-[-0.02em] font-black text-slate-900 mt-2">{totalEvents || 0}</h2>
          </Link>

          <Link href="/admin/events?filter=pending" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#6C47FF]/20 transition-all cursor-pointer">
            <BarChart3 className="w-6 h-6 text-[#6C47FF] mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending Reviews</p>
            <h2 className="text-4xl font-['Outfit'] tracking-[-0.02em] font-black text-slate-900 mt-2">{pendingEvents?.length || 0}</h2>
          </Link>
          
          {/* Active Reports Stat Card */}
          <Link href="/admin/reports" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md hover:ring-2 hover:ring-red-500/20 transition-all cursor-pointer">
            <ShieldAlert className="w-6 h-6 text-red-500 mb-4" />
            <p className="text-sm font-bold text-red-400 uppercase tracking-widest">Active Reports</p>
            <h2 className="text-4xl font-['Outfit'] tracking-[-0.02em] font-black text-red-600 mt-2">{activeReports?.length || 0}</h2>
          </Link>
        </div>

        {/* Top Colleges Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
          <Link href="/admin/colleges" className="flex items-center justify-between mb-4 group hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-900" />
              <h3 className="font-['Outfit'] tracking-[-0.02em] font-bold text-lg text-slate-900">Top Performing Colleges</h3>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topColleges.map(([college, count], index) => (
              <div key={college} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-slate-300">#{index + 1}</span>
                  <span className="font-bold text-slate-700 truncate">{college}</span>
                </div>
                <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-[#6C47FF] border border-slate-200">{count} Users</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Approval Queue Section */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-fit">
            <Link href="/admin/events?filter=pending" className="p-6 border-b border-slate-100 flex items-center justify-between group hover:bg-slate-50 transition-colors cursor-pointer">
              <h3 className="font-['Outfit'] tracking-[-0.02em] font-bold text-lg text-slate-900">Event Approval Queue</h3>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </Link>

            <div className="divide-y divide-slate-100">
              {pendingEvents && pendingEvents.length > 0 ? (
                pendingEvents.map((event) => (
                  <div key={event.id} className="p-6 flex flex-col gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex gap-4">
                      <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <Image src={event.poster_url || "/window.svg"} alt={event.title || "Event Image"} fill sizes="80px" className="object-cover" />
                      </div>
                      <div>
                        <Link href={`/events/${event.slug || event.id}`} target="_blank" className="hover:text-[#6C47FF] transition-colors group/title">
                          <h4 className="font-bold text-slate-900 group-hover/title:text-[#6C47FF] leading-tight line-clamp-1">{event.title}</h4>
                        </Link>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[10px] font-bold text-[#6C47FF] bg-[#6C47FF]/10 px-2 py-0.5 rounded uppercase tracking-wider">{event.category}</p>
                          <span className="text-[11px] font-medium text-slate-500 truncate">by {(event.profiles as any)?.full_name || "Unknown"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <form action={handleApprove} className="flex-1">
                        <input type="hidden" name="eventId" value={event.id ?? ""} />
                        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-100 transition-all">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                      </form>

                      <form action={handleReject} className="flex-1">
                        <input type="hidden" name="eventId" value={event.id} />
                        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-500 px-4 py-2 rounded-full text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-all">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  Inbox Zero
                </div>
              )}
            </div>
          </div>

          {/* User Reports Section */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-fit">
            <Link href="/admin/reports" className="p-6 border-b border-slate-100 bg-red-50/30 flex items-center justify-between group hover:bg-red-100/50 transition-colors cursor-pointer">
              <h3 className="font-['Outfit'] tracking-[-0.02em] font-bold text-lg text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> User Reports
              </h3>
              <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" />
            </Link>

            <div className="divide-y divide-slate-100">
              {activeReports && activeReports.length > 0 ? (
                activeReports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                          {report.reason}
                        </span>
                        {/* TypeScript error is resolved here */}
                        <h4 className="font-bold text-slate-900 mt-2">{report.events?.title || "Unknown Event"}</h4>
                      </div>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">Pending</span>
                    </div>
                    
                    {/* THE NEW BUTTONS: Dismiss & Punish */}
                    <div className="flex gap-2 mt-4">
                      <form action={handleResolve} className="flex-1">
                        <input type="hidden" name="reportId" value={report.id} />
                        <button type="submit" className="w-full bg-slate-100 text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors">
                          Dismiss (Safe)
                        </button>
                      </form>
                      
                      <form action={handlePunish} className="flex-1">
                        <input type="hidden" name="reportId" value={report.id} />
                        <button type="submit" className="w-full bg-red-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-600 transition-colors">
                          Punish (-150 ET)
                        </button>
                      </form>
                    </div>

                  </div>
                ))
              ) : (
                <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No active reports
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Platform Feedback Section */}
        <div className="mt-8 bg-white rounded-2xl overflow-hidden shadow-sm h-fit">
          <div className="p-6 border-b border-slate-100 bg-blue-50/30 flex items-center justify-between">
            <h3 className="font-['Outfit'] tracking-[-0.02em] font-bold text-lg text-slate-900 flex items-center gap-2">
              Platform Feedback & Bugs
            </h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {platformFeedback && platformFeedback.length > 0 ? (
              platformFeedback.map((feedback: any) => (
                <div key={feedback.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${feedback.type === 'bug' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {feedback.type}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{feedback.message}</p>
                  <p className="text-xs text-slate-400 mt-3 font-medium">From: {feedback.profiles?.full_name || "Anonymous"}</p>
                </div>
              ))
            ) : (
              <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                No feedback yet
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}