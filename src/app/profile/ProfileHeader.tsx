"use client";

import Link from "next/link";
import { ChevronRight, GraduationCap, Pencil } from "lucide-react";
import type { ProfileRow } from "@/types";
import type { ProfileEvent } from "./ProfileClient";
import { BrandAvatar } from "@/components/ui/BrandAvatar";

const SILVER_CURATOR_EVENTS = 30;
const GOLD_CURATOR_EVENTS = 69;
const VISIBLE_GOALS = 3;

function getTierLabel(eventCount: number) {
  if (eventCount >= GOLD_CURATOR_EVENTS) return "Gold Curator";
  if (eventCount >= SILVER_CURATOR_EVENTS) return "Silver Curator";
  return "Curator";
}

function getMissingSteps(profile: Partial<ProfileRow>) {
  const isStudent = profile.user_type === "student";
  const steps = [
    { label: "username", done: Boolean(profile.username) },
    { label: "cities", done: Boolean(profile.preferred_cities?.length) },
    { label: "interests", done: Boolean(profile.goals?.length) },
    { label: "graduation year", done: !isStudent || Boolean(profile.graduation_year) },
  ];
  return { missing: steps.filter((step) => !step.done).map((step) => step.label), total: steps.length };
}

const sumCounts = (events: ProfileEvent[], read: (event: ProfileEvent) => number | undefined) =>
  events.reduce((total, event) => total + (read(event) || 0), 0);

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-heading text-xl font-bold tabular-nums text-slate-900">{value}</div>
      <div className="mt-0.5 text-[13px] text-slate-500">{label}</div>
    </div>
  );
}

export function ProfileHeader({
  user,
  profile,
  myEvents,
  leaderboardEnabled,
}: {
  user: any;
  profile: Partial<ProfileRow>;
  myEvents: ProfileEvent[];
  leaderboardEnabled: boolean;
}) {
  const score = profile.et_score || 100;
  const { missing, total } = getMissingSteps(profile);
  const progressPercent = Math.round(((total - missing.length) / total) * 100);
  const goals = profile.goals || [];
  // Some accounts hold the literal placeholder "User"; their username says more about them.
  const realName = profile.full_name === "User" ? null : profile.full_name;

  return (
    <header>
      <div className="flex items-center gap-4 sm:gap-5">
        <BrandAvatar seed={profile.username || user?.email} className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {realName || user?.user_metadata?.full_name || profile.username || "Your profile"}
          </h1>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {profile.username ? `@${profile.username}` : user?.email}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">
            {getTierLabel(myEvents.length)}
            {leaderboardEnabled && ` · ${score} ET`}
          </p>
        </div>

        <Link
          href="/profile/settings"
          aria-label="Edit profile"
          className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 sm:w-auto sm:px-4"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Edit profile</span>
        </Link>
      </div>

      {profile.user_type === "student" && profile.college && (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">
            {profile.college}
            {profile.branch ? ` · ${profile.branch}` : ""}
            {profile.graduation_year ? ` · ${profile.graduation_year}` : ""}
          </span>
        </p>
      )}

      {goals.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {goals.slice(0, VISIBLE_GOALS).map((goal) => (
            <span key={goal} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {goal}
            </span>
          ))}
          {goals.length > VISIBLE_GOALS && <span className="text-xs text-slate-500">+{goals.length - VISIBLE_GOALS} more</span>}
        </div>
      )}

      {missing.length > 0 && (
        <Link
          href="/profile/settings"
          className="mt-5 flex min-h-11 items-center gap-3 rounded-2xl bg-[#F1EDFF] px-4 py-3 transition-colors hover:bg-[#E8E5FF]"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">Finish your profile for a better feed</p>
            <p className="mt-0.5 truncate text-[13px] text-slate-600">Add your {missing.join(", ")}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-brand-primary" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
        </Link>
      )}

      <div className={`mt-6 grid gap-4 border-y border-slate-100 py-4 ${leaderboardEnabled ? "grid-cols-4" : "grid-cols-3"}`}>
        <Stat value={myEvents.length} label="Events" />
        <Stat value={sumCounts(myEvents, (event) => event.interested_events?.[0]?.count)} label="Interested" />
        <Stat value={sumCounts(myEvents, (event) => event.registered_events?.[0]?.count)} label="Registered" />
        {leaderboardEnabled && <Stat value={score} label="Score" />}
      </div>
    </header>
  );
}
