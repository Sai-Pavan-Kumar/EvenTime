import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { AlertTriangle } from "lucide-react";
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

  // Wrapper functions for server actions
  async function handleResolve(formData: FormData) {
    "use server";
    await resolveReportAction(formData);
  }

  async function handlePunish(formData: FormData) {
    "use server";
    await punishCuratorAction(formData);
  }

  // Fetch Active Reports
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
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-['Outfit'] tracking-[-0.02em] font-black text-slate-900 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            User Reports
          </h1>
          <p className="text-slate-500 font-medium mt-2">Review and manage community-flagged events.</p>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {activeReports && activeReports.length > 0 ? (
              activeReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                        {report.reason}
                      </span>
                      <h4 className="font-bold text-slate-900 mt-2">{report.events?.title || "Unknown Event"}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Reported on: {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">Pending</span>
                  </div>
                  
                  <div className="flex gap-4 mt-6">
                    <form action={handleResolve} className="flex-1">
                      <input type="hidden" name="reportId" value={report.id} />
                      <button type="submit" className="w-full bg-slate-100 text-slate-600 text-sm font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                        Dismiss (Safe)
                      </button>
                    </form>
                    
                    <form action={handlePunish} className="flex-1">
                      <input type="hidden" name="reportId" value={report.id} />
                      <button type="submit" className="w-full bg-red-500 text-white text-sm font-bold py-3 rounded-xl hover:bg-red-600 transition-colors">
                        Punish (-150 ET)
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                No active reports
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}