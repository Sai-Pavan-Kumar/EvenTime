import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { resolveReportAction, punishCuratorAction } from "../actions";
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

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = await requireAdmin(supabase, user.id);
  if (!isAdmin) {
    redirect("/");
  }

  async function handleResolve(formData: FormData) {
    "use server";
    await resolveReportAction(formData);
  }

  async function handlePunish(formData: FormData) {
    "use server";
    await punishCuratorAction(formData);
  }

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
    <div className="px-10 pb-12 max-w-[1400px] mx-auto space-y-10 pt-4">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-[20px] flex items-center justify-center bg-[rgba(239,68,68,0.08)]">
          <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
        </div>
        <div>
          <h1 className="text-[32px] font-['Outfit'] font-bold text-[#0D0D1A] tracking-[-1px]">User Reports</h1>
          <p className="text-[15px] text-[#555570] font-['Switzer'] mt-1">Review and manage community-flagged events.</p>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-[32px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="divide-y divide-black/[0.04]">
          {activeReports && activeReports.length > 0 ? (
            activeReports.map((report) => (
              <div key={report.id} className="p-8 hover:bg-surface-base/50 transition-colors">
                <div className="flex items-start justify-between gap-5 mb-5">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[rgba(239,68,68,0.08)] text-[#EF4444] text-[11px] font-bold uppercase tracking-[0.15em] font-['Outfit']">
                      {report.reason}
                    </span>
                    <h4 className="font-bold text-[20px] font-['Outfit'] text-[#0D0D1A] mt-3 leading-snug">{report.events?.title || "Unknown Event"}</h4>
                    <p className="text-[14px] font-['Switzer'] text-[#6B7280] mt-1.5">
                    Reported on: {new Date(report.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#6B7280] bg-surface-base px-3 py-1.5 rounded-[12px] uppercase tracking-[0.15em] font-['Outfit']">Pending</span>
                </div>
                
                <div className="flex gap-4 mt-8">
                  <form action={handleResolve} className="w-[200px]">
                    <input type="hidden" name="reportId" value={report.id} />
                    <button type="submit" className="w-full bg-surface-base text-[#0D0D1A] font-['Outfit'] text-[15px] font-bold py-3.5 rounded-full hover:bg-[#EAEAEA] transition-colors border border-black/[0.04]">
                      Dismiss (Safe)
                    </button>
                  </form>
                  
                  <form action={handlePunish} className="w-[200px]">
                    <input type="hidden" name="reportId" value={report.id} />
                    <button type="submit" className="w-full bg-[#EF4444] text-white font-['Outfit'] text-[15px] font-bold py-3.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-[0_4px_16px_rgba(239,68,68,0.3)]">
                    Punish (-25 ET)
                  </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="p-24 text-center flex flex-col items-center justify-center">
              <div className="w-[72px] h-[72px] rounded-full bg-surface-base flex items-center justify-center mb-5">
                <ShieldAlert className="w-8 h-8 text-[#6B7280]" />
              </div>
              <p className="text-[20px] font-bold font-['Outfit'] text-[#0D0D1A]">No active reports</p>
              <p className="text-[15px] text-[#555570] font-['Switzer'] mt-2">Community is safe and clean.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}