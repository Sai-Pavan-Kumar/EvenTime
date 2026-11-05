"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart2,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Info,
  LayoutGrid,
  Settings,
  Shield,
  Trophy,
} from "lucide-react";
import { MobileSignOutButton } from "@/components/profile/MobileSignOutButton";
import { MobileFeedbackWrapper } from "./MobileFeedbackWrapper";

export function switchTabWithoutServer(event: MouseEvent<HTMLAnchorElement>) {
  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  window.history.pushState(null, "", event.currentTarget.getAttribute("href"));
}

export const NAV_ROW_CLASS =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium transition-colors";

function NavLink({
  href,
  icon: Icon,
  label,
  count,
  isActive = false,
  isUrgent = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  isActive?: boolean;
  isUrgent?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={href.startsWith("?") ? switchTabWithoutServer : undefined}
      className={`${NAV_ROW_CLASS} text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${isActive ? "lg:bg-slate-100 lg:text-slate-900" : ""}`}
    >
      {/* Active styling is desktop only: on a phone this menu is its own screen, so no section is open yet. */}
      <Icon className={`h-[18px] w-[18px] shrink-0 text-slate-400 ${isActive ? "lg:text-brand-primary" : ""}`} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {Boolean(count) && (
        <span className={`text-[13px] tabular-nums ${isUrgent ? "font-bold text-red-600" : "text-slate-500"}`}>{count}</span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 lg:hidden" />
    </Link>
  );
}

export function ProfileNav({
  activeTab,
  postedCount,
  registeredCount,
  savedCount,
  alertCount,
  leaderboardEnabled,
  isAdmin,
}: {
  activeTab: string;
  postedCount: number;
  registeredCount: number;
  savedCount: number;
  alertCount: number;
  leaderboardEnabled: boolean;
  isAdmin: boolean;
}) {
  return (
    <nav aria-label="Profile" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 rounded-2xl border border-slate-200/70 bg-white p-1.5">
        <NavLink href="?tab=posted" icon={LayoutGrid} label="My events" count={postedCount} isActive={activeTab === "posted"} />
        <NavLink href="?tab=registered" icon={CheckCircle2} label="Registrations" count={registeredCount} isActive={activeTab === "registered"} />
        <NavLink href="?tab=saved" icon={Bookmark} label="Saved" count={savedCount} isActive={activeTab === "saved"} />
        <NavLink href="?tab=alerts" icon={AlertTriangle} label="Alerts" count={alertCount} isActive={activeTab === "alerts"} isUrgent />
      </div>

      <div className="flex flex-col gap-0.5 rounded-2xl border border-slate-200/70 bg-white p-1.5">
        {leaderboardEnabled && <NavLink href="/leaderboard" icon={Trophy} label="Leaderboard" />}
        <NavLink href="/stats" icon={BarChart2} label="Live platform stats" />
        <NavLink href="/about" icon={Info} label="About EvenTime" />
        <NavLink href="/profile/settings" icon={Settings} label="Settings" />
        {isAdmin && <NavLink href="/et98" icon={Shield} label="Admin console" />}
      </div>

      <div className="flex flex-col gap-0.5 rounded-2xl border border-slate-200/70 bg-white p-1.5">
        <MobileFeedbackWrapper />
        <MobileSignOutButton />
      </div>
    </nav>
  );
}
