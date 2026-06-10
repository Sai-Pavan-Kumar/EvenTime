import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Building2, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminCollegesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = await requireAdmin(supabase, user.id);
  if (!isAdmin) {
    redirect("/");
  }

  // Fetch all profiles with a college attached
  const { data: collegesData } = await supabase
    .from("profiles")
    .select("college")
    .not("college", "is", null);

  // Group and count
  const collegeCounts = collegesData?.reduce((acc: Record<string, number>, profile) => {
    if (profile.college) {
      acc[profile.college] = (acc[profile.college] || 0) + 1;
    }
    return acc;
  }, {}) || {};
  
  // Sort descending by user count
  const allColleges = Object.entries(collegeCounts).sort(([, a], [, b]) => b - a);

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-['Outfit'] tracking-[-0.02em] font-black text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-slate-900" />
            College Analytics
          </h1>
          <p className="text-slate-500 font-medium mt-2">Global platform adoption ranked by institution.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Institution Name</span>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Users</span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {allColleges.length > 0 ? (
              allColleges.map(([college, count], index) => (
                <div key={college} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-lg font-black text-slate-300 text-right">#{index + 1}</span>
                    <span className="font-bold text-slate-700 text-lg">{college}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#6C47FF]/10 px-4 py-2 rounded-lg">
                    <Users className="w-4 h-4 text-[#6C47FF]" />
                    <span className="font-bold text-[#6C47FF]">{count}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                No college data available
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}