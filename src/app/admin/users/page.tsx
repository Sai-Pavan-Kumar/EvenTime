import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trash2, Shield, User as UserIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { deleteUserAction, updateUserRoleAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = await requireAdmin(supabase, user.id);
  if (!isAdmin) redirect("/");

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, et_score, user_type, preferred_cities, goals")
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching users:", error.message || JSON.stringify(error));
  }

  async function handleRoleUpdate(formData: FormData) {
    "use server";
    await updateUserRoleAction(formData);
  }

  async function handleDeleteUser(formData: FormData) {
    "use server";
    await deleteUserAction(formData);
  }

  return (
    <div className="px-10 pb-12 max-w-[1400px] mx-auto space-y-10 pt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-['Outfit'] font-bold text-[#0D0D1A] tracking-[-1px]">User Management</h1>
          <p className="text-[15px] text-[#555570] font-['Switzer'] mt-1">View, edit, and manage all registered users.</p>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-[#FFFFFF] rounded-[32px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFFFFF] border-b border-black/[0.04]">
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">User</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">User Type</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">Cities</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">Categories</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">Role</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0]">ET Score</th>
                <th className="px-8 py-6 text-[12px] font-bold uppercase tracking-[0.2em] font-['Outfit'] text-[#9999B0] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {users && users.length > 0 ? (
                users.map((profile) => (
                  <tr key={profile.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    
                    {/* Avatar & Info */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-[44px] h-[44px] rounded-full bg-[#F5F5F7] border border-black/[0.04] flex items-center justify-center overflow-hidden shrink-0">
                          {profile.avatar_url ? (
                            <Image src={profile.avatar_url} alt={profile.full_name || "User"} width={44} height={44} className="object-cover w-full h-full" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-[#9999B0]" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold font-['Outfit'] text-[#0D0D1A] text-[16px] leading-tight">{profile.full_name || "Anonymous User"}</p>
                          <p className="text-[13px] font-medium font-['Switzer'] text-[#555570] mt-1">{profile.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* User Type */}
                    <td className="px-8 py-6">
                      {profile.user_type ? (
                        <span className="text-[14px] font-bold font-['Outfit'] text-[#0D0D1A] whitespace-nowrap">{profile.user_type}</span>
                      ) : (
                        <span className="text-[14px] font-medium font-['Switzer'] text-[#9999B0] italic">Not specified</span>
                      )}
                    </td>

                    {/* Interested Cities */}
                    <td className="px-8 py-6">
                      {profile.preferred_cities && profile.preferred_cities.length > 0 ? (
                        <span className="text-[14px] font-medium font-['Switzer'] text-[#555570]">{profile.preferred_cities.join(", ")}</span>
                      ) : (
                        <span className="text-[14px] font-medium font-['Switzer'] text-[#9999B0] italic">Not specified</span>
                      )}
                    </td>

                    {/* Categories */}
                    <td className="px-8 py-6">
                      {profile.goals && profile.goals.length > 0 ? (
                        <span className="text-[14px] font-medium font-['Switzer'] text-[#555570] line-clamp-2 max-w-[200px]">{profile.goals.join(", ")}</span>
                      ) : (
                        <span className="text-[14px] font-medium font-['Switzer'] text-[#9999B0] italic">Not specified</span>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-8 py-6">
                      {profile.role === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[rgba(108,71,255,0.08)] text-[#6C47FF] text-[11px] font-bold uppercase tracking-[0.15em] font-['Outfit']">
                          <Shield className="w-3.5 h-3.5" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[#F5F5F7] text-[#555570] text-[11px] font-bold uppercase tracking-[0.15em] font-['Outfit']">
                          <UserIcon className="w-3.5 h-3.5" /> User
                        </span>
                      )}
                    </td>

                    {/* ET Score */}
                    <td className="px-8 py-6">
                      <span className="text-[18px] font-black text-[#0D0D1A] font-['Outfit']">{profile.et_score || 0}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-3">
                        
                        {/* Role Toggle */}
                        {profile.id !== user.id && (
                          <form action={handleRoleUpdate}>
                            <input type="hidden" name="userId" value={profile.id} />
                            <input type="hidden" name="role" value={profile.role === "admin" ? "user" : "admin"} />
                            <button 
                              type="submit" 
                              className={`px-4 py-2 rounded-full text-[13px] font-bold font-['Outfit'] transition-colors ${
                                profile.role === "admin" 
                                  ? "bg-[#F5F5F7] text-[#555570] hover:bg-[#EAEAEA]" 
                                  : "bg-[#EDE8FF] text-[#6C47FF] hover:bg-[#DED5FF]"
                              }`}
                            >
                              {profile.role === "admin" ? "Demote" : "Make Admin"}
                            </button>
                          </form>
                        )}

                        {/* Delete */}
                        {profile.id !== user.id && (
                          <form action={handleDeleteUser}>
                            <input type="hidden" name="userId" value={profile.id} />
                            <button 
                              type="submit" 
                              className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[#9999B0] hover:bg-[#EF4444] hover:text-white transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center text-[#9999B0] font-bold uppercase tracking-widest text-[13px] font-['Outfit']">
                    No users found
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