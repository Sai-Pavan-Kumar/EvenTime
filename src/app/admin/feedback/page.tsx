import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
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

  // Fetch all platform feedback without a limit
  // Note: Removed the 'profiles' join temporarily until a Foreign Key constraint is added in the Supabase DB.
  const { data: platformFeedback, error } = await supabase
    .from("platform_feedback")
    .select("id, type, message, created_at, user_id")
    .order("created_at", { ascending: false });

  // Manually fetch user profiles since FK is missing
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
    <main className="min-h-screen bg-[#F5F5F7]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-['Outfit'] tracking-[-0.02em] font-black text-slate-900 flex items-center gap-3">
            <MessageSquareWarning className="w-8 h-8 text-blue-500" />
            Platform Feedback & Bugs
          </h1>
          <p className="text-slate-500 font-medium mt-2">Review all user-submitted bug reports and feature requests.</p>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {platformFeedback && platformFeedback.length > 0 ? (
              platformFeedback.map((feedback: any) => (
                <div key={feedback.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${feedback.type === 'bug' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {feedback.type}
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        {new Date(feedback.created_at).toLocaleDateString()} at {new Date(feedback.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-3">
                    <p className="text-base text-slate-800 whitespace-pre-wrap">{feedback.message}</p>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">
                        {feedback.profiles?.full_name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      Submitted by <span className="text-slate-700 font-bold">{feedback.profiles?.full_name || "Anonymous User"}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                No feedback submitted yet
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}