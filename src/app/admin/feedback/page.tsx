import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquareWarning } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = await requireAdmin(supabase, user.id);
  if (!isAdmin) {
    redirect("/");
  }

  const { data: platformFeedback, error } = await supabase
    .from("platform_feedback")
    .select("id, type, message, created_at, user_id")
    .order("created_at", { ascending: false });

  const userIds = platformFeedback?.map((f: any) => f.user_id).filter(Boolean) || [];
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name, email, username")
    .in("id", userIds);
    
  const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);

  if (error) {
    console.error("Fetch Feedback Error:", JSON.stringify(error, null, 2));
  }

  return (
    <div className="px-10 pb-12 max-w-[1400px] mx-auto space-y-10 pt-4">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-[20px] flex items-center justify-center bg-[rgba(51,128,240,0.08)]">
          <MessageSquareWarning className="w-7 h-7 text-[#3380F0]" />
        </div>
        <div>
          <h1 className="text-[32px] font-['Outfit'] font-bold text-[#0D0D1A] tracking-[-1px]">Platform Feedback & Bugs</h1>
          <p className="text-[15px] text-[#555570] font-['Switzer'] mt-1">Review all user-submitted bug reports and feature requests.</p>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-[32px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="divide-y divide-black/[0.04]">
          {platformFeedback && platformFeedback.length > 0 ? (
            platformFeedback.map((feedback: any) => (
              <div key={feedback.id} className="p-8 hover:bg-[#F5F5F7]/50 transition-colors">
                <div className="flex items-start justify-between gap-5 mb-4">
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[11px] font-bold font-['Outfit'] uppercase tracking-[0.15em] ${feedback.type === 'bug' ? 'bg-[rgba(239,68,68,0.08)] text-[#EF4444]' : 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B]'}`}>
                      {feedback.type}
                    </span>
                    <span className="text-[13px] font-bold font-['Switzer'] text-[#9999B0]">
                      {new Date(feedback.created_at).toLocaleDateString()} at {new Date(feedback.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <div className="bg-[#F5F5F7] p-6 rounded-[20px] mt-4">
                  <p className="text-[16px] font-['Switzer'] text-[#0D0D1A] whitespace-pre-wrap leading-relaxed">{feedback.message}</p>
                </div>
                
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EDE8FF] flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-bold font-['Outfit'] text-[#6C47FF]">
                      {feedback.profiles?.full_name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#555570] font-medium font-['Switzer']">
                    Submitted by <span className="text-[#0D0D1A] font-bold">{feedback.profiles?.full_name || "Anonymous User"}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-24 text-center text-[#9999B0] font-bold uppercase tracking-[0.2em] text-[13px] font-['Outfit']">
              No feedback submitted yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}