"use client";

import Link from "next/link";
import { Award, ChevronRight, GraduationCap, Pencil } from "lucide-react";
import type { ProfileRow } from "@/types";
import type { ProfileEvent } from "./ProfileClient";
import { BrandAvatar } from "@/components/ui/BrandAvatar";
import { createBrandAvatar } from "@/lib/profile/brandAvatar";

const SILVER_CURATOR_EVENTS = 30;
const GOLD_CURATOR_EVENTS = 69;
const VISIBLE_GOALS = 3;

function getTierLabel(eventCount: number) {
  if (eventCount >= GOLD_CURATOR_EVENTS) return "Gold Curator";
  if (eventCount >= SILVER_CURATOR_EVENTS) return "Silver Curator";
  return "Curator";
}

function getNextTier(eventCount: number) {
  if (eventCount >= GOLD_CURATOR_EVENTS) return null;
  if (eventCount >= SILVER_CURATOR_EVENTS) return { label: "Gold Curator", target: GOLD_CURATOR_EVENTS };
  return { label: "Silver Curator", target: SILVER_CURATOR_EVENTS };
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
    <div className="px-3 py-4 first:pl-0 sm:px-6">
      <div className="font-heading text-2xl font-bold tabular-nums text-slate-900">{value}</div>
      <div className="mt-0.5 text-[13px] text-slate-500">{label}</div>
    </div>
  );
}

function TierProgress({ eventCount }: { eventCount: number }) {
  const nextTier = getNextTier(eventCount);
  if (!nextTier) return null;
  const remaining = nextTier.target - eventCount;
  return (
    <div className="border-t border-slate-100 py-4">
      <p className="text-[13px] text-slate-600">
        {remaining} more {remaining === 1 ? "event" : "events"} to {nextTier.label}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${(eventCount / nextTier.target) * 100}%` }} />
      </div>
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
  const avatarSeed = profile.username || user?.email;

  return (
    <header className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white">
      {/* The band takes the avatar's colour, so every profile looks like its owner's without an upload. */}
      <div className="h-20 sm:h-28" style={{ backgroundColor: createBrandAvatar(avatarSeed).background }} />

      <div className="px-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <BrandAvatar seed={avatarSeed} className="-mt-10 h-20 w-20 shrink-0 rounded-full ring-4 ring-white sm:-mt-12 sm:h-24 sm:w-24" />
          <Link
            href="/profile/settings"
            aria-label="Edit profile"
            className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 sm:w-auto sm:px-4"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit profile</span>
          </Link>
        </div>

        <h1 className="mt-3 truncate font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {realName || user?.user_metadata?.full_name || profile.username || "Your profile"}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="min-w-0 truncate text-sm text-slate-500">{profile.username ? `@${profile.username}` : user?.email}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            {getTierLabel(myEvents.length)}
          </span>
        </div>

        {profile.user_type === "student" && profile.college && (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
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

        <div className={`mt-5 grid divide-x divide-slate-100 border-t border-slate-100 ${leaderboardEnabled ? "grid-cols-4" : "grid-cols-3"}`}>
          {leaderboardEnabled && (
            <div className="py-4 pr-3 sm:pr-6">
              <div className="font-heading text-2xl font-bold tabular-nums text-brand-primary">{score}</div>
              <div className="mt-0.5 text-[13px] text-slate-500">ET score</div>
            </div>
          )}
          <Stat value={myEvents.length} label="Events posted" />
          <Stat value={sumCounts(myEvents, (event) => event.interested_count)} label="People interested" />
          <Stat value={sumCounts(myEvents, (event) => event.registered_count)} label="People registered" />
        </div>

        <TierProgress eventCount={myEvents.length} />
      </div>
    </header>
  );
}
