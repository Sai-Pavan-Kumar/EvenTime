import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
    <div className="px-10 pb-12 max-w-[1400px] mx-auto space-y-10 pt-4">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-[20px] flex items-center justify-center bg-[rgba(108,71,255,0.08)]">
          <Building2 className="w-7 h-7 text-[#6C47FF]" />
        </div>
        <div>
          <h1 className="text-[32px] font-['Outfit'] font-bold text-[#0D0D1A] tracking-[-1px]">College Analytics</h1>
          <p className="text-[15px] text-[#555570] font-['Switzer'] mt-1">Global platform adoption ranked by institution.</p>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-[32px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-8 border-b border-black/[0.04] bg-[#FFFFFF] flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.2em] font-['Outfit']">Institution Name</span>
          <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-[0.2em] font-['Outfit']">Total Users</span>
        </div>
        
        <div className="divide-y divide-black/[0.04]">
          {allColleges.length > 0 ? (
            allColleges.map(([college, count], index) => (
              <div key={college} className="flex items-center justify-between p-8 hover:bg-[#F5F5F7]/50 transition-colors">
                <div className="flex items-center gap-5">
                  <span className="w-8 text-[18px] font-black text-[#6B7280] text-right font-['Outfit']">#{index + 1}</span>
                  <span className="font-bold text-[#0D0D1A] text-[18px] font-['Outfit']">{college}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#EDE8FF] px-5 py-2.5 rounded-full">
                  <Users className="w-4 h-4 text-[#6C47FF]" />
                  <span className="font-bold text-[#6C47FF] font-['Outfit'] text-[15px]">{count}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-24 text-center text-[#6B7280] font-bold uppercase tracking-widest text-sm font-['Outfit']">
              No college data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}