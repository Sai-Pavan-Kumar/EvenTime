"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please login to update settings." };
  }

  const fullName = formData.get("fullName") as string;
  const username = (formData.get("username") as string).toLowerCase().trim();
  const college = formData.get("college") as string;
  const branch = formData.get("branch") as string;
  const graduationYear = formData.get("graduationYear") as string;
  const user_type = formData.get("user_type") as string;

  const ALLOWED_USER_TYPES = ["student", "founder", "investor", "recent graduate", "professional", "prefer not to say"];
  if (!user_type || !ALLOWED_USER_TYPES.includes(user_type.toLowerCase())) {
    return { error: "Please select what you are." };
  }

  // Validate username
  const USERNAME_REGEX = /^[a-z0-9_.-]{3,30}$/;
  if (!fullName || fullName.length > 100) return { error: "Full name must be 1–100 characters." };
  if (!USERNAME_REGEX.test(username)) return { error: "Username: 3–30 chars, letters/numbers/._- only." };
  if (college && college.length > 200) return { error: "College name too long." };
  if (branch && branch.length > 100) return { error: "Branch name too long." };

  // Parse preferred_cities (array, max 3)
  const citiesString = formData.get("preferred_cities") as string;
  let preferred_cities: string[] = [];
  if (citiesString) {
    try {
      const parsed = JSON.parse(citiesString);
      if (!Array.isArray(parsed)) throw new Error();
      preferred_cities = parsed
        .filter((c): c is string => typeof c === "string" && c.length > 0)
        .slice(0, 3);
    } catch {
      return { error: "Invalid cities format." };
    }
  }

  // Parse goals (categories, max 6)
  const goalsString = formData.get("goals") as string;
  let goals: string[] = [];
  if (goalsString) {
    try {
      const parsed = JSON.parse(goalsString);
      if (!Array.isArray(parsed)) throw new Error();
      goals = parsed
        .filter((g): g is string => typeof g === "string")
        .slice(0, 6)
        .map(g => g.slice(0, 50));
    } catch {
      return { error: "Invalid goals format." };
    }
  }

  // Check username uniqueness
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .single();

  if (existingUser) {
    return { error: "This username is already taken. Please choose another." };
  }

  const isStudent = user_type.toLowerCase() === "student";

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: fullName,
      user_type: user_type.toLowerCase(),
      preferred_cities,
      college: isStudent ? college : null,
      branch: isStudent ? branch : null,
      graduation_year: isStudent ? graduationYear : null,
      goals,
      is_onboarded: true,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Settings Update Error: ", error);
    return { error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");

  return { success: true };
}