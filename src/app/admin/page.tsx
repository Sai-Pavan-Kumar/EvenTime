import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle, Users, ShieldAlert, BarChart3, Ticket, TrendingUp } from "lucide-react";
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
    <div className="px-10 pb-12 max-w-350 mx-auto space-y-12">
      
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-['Outfit'] font-bold text-[#0D0D1A] tracking-[-1px]">Platform Overview</h1>
          <p className="text-[15px] text-[#555570] font-['Switzer'] mt-1">Monitor your platform metrics and moderation queues.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <form action={handleToggleLeaderboard}>
            <input type="hidden" name="enabled" value={(!leaderboardEnabled).toString()} />
            <button type="submit" className={`relative flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-200 ${leaderboardEnabled ? "bg-surface-card text-[#0D0D1A] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(108,71,255,0.12),0_1px_4px_rgba(0,0,0,0.06)]" : "bg-surface-elevated text-[#6B7280]"}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${leaderboardEnabled ? "bg-[#22C55E]" : "bg-[#6B7280]"}`} />
              <span className="text-[14px] font-bold font-['Outfit'] tracking-wide">LEADERBOARD</span>
            </button>
          </form>
          
          <form action={handleToggleFeatured}>
            <input type="hidden" name="enabled" value={(!featuredEnabled).toString()} />
            <button type="submit" className={`relative flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-200 ${featuredEnabled ? "bg-surface-card text-[#0D0D1A] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(108,71,255,0.12),0_1px_4px_rgba(0,0,0,0.06)]" : "bg-surface-elevated text-[#6B7280]"}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${featuredEnabled ? "bg-brand-primary" : "bg-[#6B7280]"}`} />
              <span className="text-[14px] font-bold font-['Outfit'] tracking-wide">FEATURED SYSTEM</span>
            </button>
          </form>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "TOTAL USERS", value: totalUsers || 0, icon: Users, color: "text-[#3380F0]", bg: "bg-[rgba(51,128,240,0.08)]" },
          { label: "TOTAL EVENTS", value: totalEvents || 0, icon: Ticket, color: "text-brand-primary", bg: "bg-[rgba(108,71,255,0.08)]" },
          { label: "PENDING APPROVALS", value: pendingEvents?.length || 0, icon: BarChart3, color: "text-brand-accent", bg: "bg-[rgba(245,158,11,0.08)]" },
          { label: "ACTIVE REPORTS", value: reports?.length || 0, icon: ShieldAlert, color: "text-[#EF4444]", bg: "bg-[rgba(239,68,68,0.08)]" }
        ].map((stat, i) => (
          <div key={i} className="bg-surface-card p-8 rounded-[32px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(108,71,255,0.12),0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-8">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
            </div>
            <h3 className="text-[56px] font-black font-['Outfit'] text-[#0D0D1A] tracking-[-2px] leading-none">{stat.value}</h3>
            <p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.2em] font-['Outfit'] mt-4">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: EVENTS QUEUE (Takes 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-['Outfit'] font-bold text-[24px] text-[#0D0D1A] tracking-[-0.5px]">
              Event Approval Queue
            </h2>
            <Link href="/admin/events" className="text-[14px] font-semibold text-brand-primary hover:text-[#5535E0] font-['Switzer']">View All</Link>
          </div>
          
          <div className="space-y-4">
            {pendingEvents && pendingEvents.length > 0 ? (
              pendingEvents.map((event) => (
                <div key={event.id} className="bg-surface-card p-5 rounded-[32px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(108,71,255,0.12),0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-300 flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-30 h-19 rounded-lg bg-surface-base overflow-hidden relative shrink-0">
                      <Image src={event.poster_url || "/window.svg"} alt="Poster" fill sizes="120px" className="object-cover" />
                    </div>
                    <div>
                      <div className="mb-2">
                        <span className="inline-block px-3 py-1.5 rounded-md bg-[#EDE8FF] text-brand-primary text-[11px] font-bold font-['Outfit'] uppercase tracking-[0.15em]">
                          {event.category}
                        </span>
                      </div>
                      <Link href={`/events/${event.slug || event.id}`} target="_blank" rel="noopener noreferrer" className="font-bold font-['Outfit'] text-[20px] text-[#0D0D1A] hover:text-brand-primary transition-colors line-clamp-1">
                        {event.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[14px] font-['Switzer'] text-[#555570]">
                          {(event.profiles as { full_name?: string } | null)?.full_name || "Unknown Organizer"}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D1D1D6]"></span>
                        <span className="text-[14px] font-['Switzer'] text-[#6B7280]">
                          {event.created_at ? new Date(event.created_at as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <form action={handleReject}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <button type="submit" className="w-12 h-12 rounded-full flex items-center justify-center text-[#555570] bg-surface-base hover:bg-[#EF4444] hover:text-white transition-all duration-200">
                        <XCircle className="w-6 h-6" />
                      </button>
                    </form>
                    <form action={handleApprove}>
                      <input type="hidden" name="eventId" value={event.id ?? ""} />
                      <button type="submit" className="px-8 h-12 rounded-full flex items-center justify-center gap-2 bg-brand-primary text-white font-['Outfit'] font-bold text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-[0_4px_16px_rgba(108,71,255,0.2)]">
                        <CheckCircle className="w-5 h-5" /> Approve
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-surface-card rounded-[32px] p-20 text-center flex flex-col items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="w-20 h-20 rounded-full bg-surface-base flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-[#6B7280]" />
                </div>
                <p className="text-[24px] font-bold font-['Outfit'] text-[#0D0D1A]">The stage is empty</p>
                <p className="text-[16px] text-[#555570] font-['Switzer'] mt-2">No events waiting for your approval.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MODERATION (Takes 1/3 width) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-['Outfit'] font-bold text-[24px] text-[#0D0D1A] tracking-[-0.5px]">
              Moderation Queue
            </h2>
          </div>
          
          <div className="space-y-4">
            {reports && reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="bg-surface-card p-8 rounded-[32px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(108,71,255,0.12),0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1.5 rounded-md bg-[rgba(239,68,68,0.08)] text-[#EF4444] text-[11px] font-bold font-['Outfit'] uppercase tracking-[0.15em]">
                      {report.reason}
                    </span>
                  </div>
                  <h4 className="text-[18px] font-bold font-['Outfit'] text-[#0D0D1A] line-clamp-2 leading-snug">{report.events?.title || "Unknown Event"}</h4>
                  <p className="text-[14px] text-[#6B7280] font-['Switzer'] mt-2">Reported on {new Date(report.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  
                  <div className="flex gap-4 mt-8">
                    <form action={handleResolve} className="flex-1">
                      <input type="hidden" name="reportId" value={report.id} />
                      <button type="submit" className="w-full h-12 rounded-full bg-surface-base text-[#0D0D1A] font-['Outfit'] font-bold text-[14px] hover:bg-[#EAEAEA] transition-colors border border-black/4`">
                        Dismiss
                      </button>
                    </form>
                    <form action={handlePunish} className="flex-1">
                      <input type="hidden" name="reportId" value={report.id} />
                      <button type="submit" className="w-full h-12 rounded-full bg-[#EF4444] text-white font-['Outfit'] font-bold text-[14px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-[0_4px_16px_rgba(239,68,68,0.3)]">
                        Punish
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
               <div className="bg-surface-card rounded-[32px] p-16 text-center flex flex-col items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="w-18 h-18 rounded-full bg-surface-base flex items-center justify-center mb-5">
                  <ShieldAlert className="w-8 h-8 text-[#6B7280]" />
                </div>
                <p className="text-[20px] font-bold font-['Outfit'] text-[#0D0D1A]">No active reports</p>
                <p className="text-[15px] text-[#555570] font-['Switzer'] mt-2">Community is safe and clean.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}