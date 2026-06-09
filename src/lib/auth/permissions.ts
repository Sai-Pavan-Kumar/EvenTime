import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "student" | "professional";

export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<UserRole | null> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data?.role ?? null;
}

export async function requireAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const role = await getUserRole(supabase, userId);
  return Boolean(role === "admin");
}