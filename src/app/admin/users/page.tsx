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

  // Fetch all profiles (exclude soft-deleted users, they're in the 30-day trash)
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, et_score, user_type, preferred_cities, goals")
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching users:", error.message || JSON.stringify(error));
  }

  // Wrapper functions for server actions
  async function handleRoleUpdate(formData: FormData) {
    "use server";
    await updateUserRoleAction(formData);
  }

  async function handleDeleteUser(formData: FormData) {
    "use server";
    await deleteUserAction(formData);
  }

  return (
    <div className="w-full">

      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-['Outfit'] tracking-[-0.02em] font-black text-slate-900">User Management</h1>
            <p className="text-slate-500 font-medium mt-1">View, edit, and manage all registered users.</p>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">User</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">User Type</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Interested Cities</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Categories</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Role</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">ET Score</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users && users.length > 0 ? (
                  users.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Avatar & Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {profile.avatar_url ? (
                              <Image src={profile.avatar_url} alt={profile.full_name || "User"} width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                              <UserIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{profile.full_name || "Anonymous User"}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">{profile.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* User Type */}
                      <td className="px-6 py-4">
                        {profile.user_type ? (
                          <span className="text-sm font-bold text-slate-700 whitespace-normal break-words">{profile.user_type}</span>
                        ) : (
                          <span className="text-sm font-medium text-slate-400 italic">Not specified</span>
                        )}
                      </td>

                      {/* Interested Cities */}
                      <td className="px-6 py-4">
                        {profile.preferred_cities && profile.preferred_cities.length > 0 ? (
                          <span className="text-sm font-medium text-slate-700 whitespace-normal break-words">{profile.preferred_cities.join(", ")}</span>
                        ) : (
                          <span className="text-sm font-medium text-slate-400 italic">Not specified</span>
                        )}
                      </td>

                      {/* Categories */}
                      <td className="px-6 py-4">
                        {profile.goals && profile.goals.length > 0 ? (
                          <span className="text-sm font-medium text-slate-700 whitespace-normal break-words">{profile.goals.join(", ")}</span>
                        ) : (
                          <span className="text-sm font-medium text-slate-400 italic">Not specified</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        {profile.role === "admin" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#6C47FF]/10 text-[#6C47FF] text-[10px] font-bold uppercase tracking-wider">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                            <UserIcon className="w-3 h-3" /> User
                          </span>
                        )}
                      </td>

                      {/* ET Score */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-900">{profile.et_score || 0}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Role Toggle Form */}
                          {profile.id !== user.id && (
                            <form action={handleRoleUpdate}>
                              <input type="hidden" name="userId" value={profile.id} />
                              <input type="hidden" name="role" value={profile.role === "admin" ? "user" : "admin"} />
                              <button 
                                type="submit" 
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                  profile.role === "admin" 
                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                    : "bg-[#6C47FF]/10 text-[#6C47FF] hover:bg-[#6C47FF]/20"
                                }`}
                              >
                                {profile.role === "admin" ? "Demote" : "Make Admin"}
                              </button>
                            </form>
                          )}

                          {/* Delete User Form */}
                          {profile.id !== user.id && (
                            <form action={handleDeleteUser}>
                              <input type="hidden" name="userId" value={profile.id} />
                              <button 
                                type="submit" 
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}