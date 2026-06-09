"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please login to update settings." };
  }

  // SERVER-SIDE SECURITY CHECK: Prevent malicious role injection
  if (formData.has("role")) {
    console.warn(`Security Warning: User ${user.id} attempted to inject a role via settings.`);
    return { error: "Unauthorized field manipulation detected." };
  }

  // Extract data from the form
  const fullName = formData.get("fullName") as string;
  const username = (formData.get("username") as string).toLowerCase().trim();
  const college = formData.get("college") as string;
  const branch = formData.get("branch") as string;
  const graduationYear = formData.get("graduationYear") as string;

  // Input Validation (H-4 Fix)
  const USERNAME_REGEX = /^[a-z0-9_.-]{3,30}$/;
  if (!fullName || fullName.length > 100) return { error: "Full name must be 1–100 characters." };
  if (!USERNAME_REGEX.test(username)) return { error: "Username: 3–30 chars, letters/numbers/._- only." };
  if (college && college.length > 200) return { error: "College name too long." };
  if (branch && branch.length > 100) return { error: "Branch name too long." };
  
  // Goals is passed as a stringified JSON array
  const goalsString = formData.get("goals") as string;
  let goals: string[] = [];
  
  if (goalsString) {
    try {
      const parsed = JSON.parse(goalsString);
      if (!Array.isArray(parsed)) throw new Error();
      goals = parsed
        .filter((g): g is string => typeof g === "string")
        .slice(0, 10)                  // max 10 goals
        .map(g => g.slice(0, 50));     // max 50 chars each
    } catch {
      return { error: "Invalid goals format." };
    }
  }

  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .single();

  if (existingUser) {
    return { error: "This username is already taken. Please choose another." };
  }
  
  // Update the profiles table
  const { error } = await supabase
    .from("profiles")
    .update({
      username: username,
      full_name: fullName,
      college: college,
      branch: branch,
      graduation_year: graduationYear,
      goals: goals,
      is_onboarded: true, // Auto-sync onboarding status!
    })
    .eq("id", user.id);

  if (error) {
    console.error("Settings Update Error: ", error);
    return { error: "Failed to update profile. Please try again." };
  }

  // Refresh both pages to show new data immediately
  revalidatePath("/profile");
  revalidatePath("/profile/settings");

  return { success: true };
}