import { Navbar } from "@/components/layout/Navbar";
import { NewEventClient } from "./NewEventClient";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const revalidate = false;

const getAppSettings = unstable_cache(
  async () => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("app_settings")
      .select("featured_enabled")
      .eq("id", 1)
      .maybeSingle();
    return data?.featured_enabled ?? true;
  },
  ["app-settings-featured"],
  { revalidate: false, tags: ["app_settings"] }
);

export default async function NewEventPage() {
  const featuredEnabled = await getAppSettings();

  return (
    <main className="min-h-screen bg-slate-50/50">
      <Navbar />
      <div className="py-12 px-4 sm:px-6">
        <NewEventClient featuredEnabled={featuredEnabled} />
      </div>
    </main>
  );
}