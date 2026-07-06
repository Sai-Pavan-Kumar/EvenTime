import { Navbar } from "@/components/layout/Navbar";
import { CreateEventForm } from "@/features/create-event/CreateEventForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data: appSettings } = await supabase.from("app_settings").select("featured_enabled").eq("id", 1).maybeSingle();
  
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('user_type, role').eq('id', user.id).maybeSingle();
    isAdmin = profile?.user_type === 'admin' || profile?.role === 'admin';
  }

  return (
    <main className="min-h-screen bg-slate-50/50">
      <Navbar />
      <div className="py-12 px-4 sm:px-6">
        <CreateEventForm isAdminFeatureEnabled={appSettings?.featured_enabled ?? true} isCurrentUserAdmin={isAdmin} />
      </div>
    </main>
  );
}