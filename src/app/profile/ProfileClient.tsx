"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import type { ProfileRow } from "@/types";
import { deleteEventAction } from "./action";
import { ProfileContent } from "./ProfileContent";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileNav, switchTabWithoutServer } from "./ProfileNav";

export type ReportWithEventSlug = {
  id: string;
  reason: string;
  status: string | null;
  created_at: string;
  events: { title: string; slug: string | null } | null;
};

export type ProfileEvent = {
  id: string;
  slug: string | null;
  title: string;
  category: string;
  date_string: string | null;
  status: string;
  poster_url: string | null;
  is_featured: boolean;
  interested_events: { count: number }[];
  saved_events: { count: number }[];
  registered_events?: { count: number }[];
};

export interface ProfileClientProps {
  initialUser: any;
  initialProfile: Partial<ProfileRow>;
  initialMyEvents: ProfileEvent[];
  initialSavedEvents: any[];
  initialRegisteredEvents?: any[];
  initialMyReports: ReportWithEventSlug[];
  initialAppSettings: any;
}

function cacheIdsForFastLookup(storageKey: string, events: any[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(events.map((event) => event.id).filter(Boolean)));
  } catch {}
}

export default function ProfileClient({
  initialUser,
  initialProfile,
  initialMyEvents,
  initialSavedEvents,
  initialRegisteredEvents = [],
  initialMyReports,
  initialAppSettings,
}: ProfileClientProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const activeTab = tab && tab !== "menu" ? tab : "posted";
  // On a phone the profile opens like iOS Settings: the menu first, each section on its own screen.
  const isMobileMenu = !tab || tab === "menu";

  const [myEvents, setMyEvents] = useState<ProfileEvent[]>(initialMyEvents || []);
  const leaderboardEnabled = initialAppSettings?.leaderboard_enabled ?? true;

  useEffect(() => cacheIdsForFastLookup("eventime_saved_ids", initialSavedEvents || []), [initialSavedEvents]);
  useEffect(() => cacheIdsForFastLookup("eventime_registered_ids", initialRegisteredEvents), [initialRegisteredEvents]);

  const handleDelete = async (formData: FormData) => {
    const eventId = formData.get("eventId") as string;
    setMyEvents((events) => events.filter((event) => event.id !== eventId));
    await deleteEventAction(formData);
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-12">
        <div className={isMobileMenu ? "block" : "hidden lg:block"}>
          <ProfileHeader user={initialUser} profile={initialProfile} myEvents={myEvents} leaderboardEnabled={leaderboardEnabled} />
        </div>

        <div className="mt-6 grid gap-12 lg:mt-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className={`lg:sticky lg:top-24 lg:self-start ${isMobileMenu ? "block" : "hidden lg:block"}`}>
            <ProfileNav
              activeTab={activeTab}
              postedCount={myEvents.length}
              registeredCount={initialRegisteredEvents.length}
              savedCount={initialSavedEvents.length}
              alertCount={initialMyReports.length}
              leaderboardEnabled={leaderboardEnabled}
              isAdmin={initialProfile?.role === "admin" || initialProfile?.user_type === "admin"}
            />
          </div>

          <div className={`min-w-0 ${isMobileMenu ? "hidden lg:block" : "block"}`}>
            <Link
              href="?tab=menu"
              onClick={switchTabWithoutServer}
              className="-ml-2 mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" /> Profile
            </Link>
            <ProfileContent
              activeTab={activeTab}
              myEvents={myEvents}
              savedEvents={initialSavedEvents || []}
              registeredEvents={initialRegisteredEvents}
              reports={initialMyReports || []}
              deleteAction={handleDelete}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
