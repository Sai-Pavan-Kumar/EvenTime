"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertTriangle,
  Building2,
  Plus,
  Search,
  ExternalLink,
  MessageSquare,
  Users,
  Star,
  RefreshCw,
  Eye,
  Loader2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import {
  approveEventAction,
  rejectEventAction,
  resolveReportAction,
  punishCuratorAction,
  toggleLeaderboardAction,
  toggleFeaturedAction,
  deleteEventAction,
  updateUserRoleAction,
  updateFeedbackStatusAction,
  addCollegeAdminAction,
} from "./actions";

export interface AdminStats {
  pendingEvents: number;
  activeEvents: number;
  totalUsers: number;
  openReports: number;
  feedbackCount: number;
  collegesCount: number;
}

export interface AdminSettings {
  leaderboardEnabled: boolean;
  featuredEnabled: boolean;
}

type TabType = "overview" | "pending" | "events" | "feedback" | "users" | "reports" | "colleges";

interface AdminConsoleProps {
  initialStats: AdminStats;
  initialSettings: AdminSettings;
  initialTab?: string;
  initialPendingEvents: any[];
  initialEvents: any[];
  initialFeedbacks: any[];
  initialUsers: any[];
  initialReports: any[];
  initialColleges: any[];
  currentUserId: string;
}

export default function AdminConsoleClient({
  initialStats,
  initialSettings,
  initialTab = "overview",
  initialPendingEvents,
  initialEvents,
  initialFeedbacks,
  initialUsers,
  initialReports,
  initialColleges,
  currentUserId,
}: AdminConsoleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab state (synced with URL)
  const validTabs: TabType[] = ["overview", "pending", "events", "feedback", "users", "reports", "colleges"];
  const urlTab = (searchParams.get("tab") as TabType) || initialTab;
  const [activeTab, setActiveTab] = useState<TabType>(validTabs.includes(urlTab as TabType) ? (urlTab as TabType) : "overview");

  // State caches
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [pendingEvents, setPendingEvents] = useState<any[]>(initialPendingEvents);
  const [events, setEvents] = useState<any[]>(initialEvents);
  const [feedbacks, setFeedbacks] = useState<any[]>(initialFeedbacks);
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [reports, setReports] = useState<any[]>(initialReports);
  const [colleges, setColleges] = useState<any[]>(initialColleges);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState<"all" | "approved" | "pending" | "rejected" | "featured">("all");

  // Transitions
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reject Modal state
  const [rejectModalEvent, setRejectModalEvent] = useState<{ id: string; title: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Add College Modal state
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [collegeState, setCollegeState] = useState("");
  const [collegeWebsite, setCollegeWebsite] = useState("");
  const [isAddingCollege, setIsAddingCollege] = useState(false);

  // Switch tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
    const newUrl = tab === "overview" ? "/et98" : `/et98?tab=${tab}`;
    window.history.replaceState(null, "", newUrl);
  };

  // Refresh data
  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success("Admin data refreshed");
      }, 500);
    });
  };

  // Toggle Leaderboard
  const handleToggleLeaderboard = async () => {
    const nextState = !settings.leaderboardEnabled;
    setSettings((prev) => ({ ...prev, leaderboardEnabled: nextState }));
    const fd = new FormData();
    fd.set("enabled", nextState.toString());
    const res = await toggleLeaderboardAction(fd);
    if (res?.error) {
      toast.error(res.error);
      setSettings((prev) => ({ ...prev, leaderboardEnabled: !nextState }));
    } else {
      toast.success(`Leaderboard ${nextState ? "enabled" : "disabled"}`);
    }
  };

  // Toggle Featured Carousel
  const handleToggleFeaturedSetting = async () => {
    const nextState = !settings.featuredEnabled;
    setSettings((prev) => ({ ...prev, featuredEnabled: nextState }));
    const fd = new FormData();
    fd.set("is_featured", nextState.toString());
    toast.success(`Featured carousel ${nextState ? "enabled" : "disabled"}`);
  };

  // Approve Event
  const handleApproveEvent = async (eventItem: any) => {
    const fd = new FormData();
    fd.set("eventId", eventItem.id);

    // Optimistic update
    setPendingEvents((prev) => prev.filter((e) => e.id !== eventItem.id));
    setEvents((prev) =>
      prev.map((e) => (e.id === eventItem.id ? { ...e, status: "approved" } : e))
    );
    setStats((prev) => ({
      ...prev,
      pendingEvents: Math.max(0, prev.pendingEvents - 1),
      activeEvents: prev.activeEvents + 1,
    }));

    const res = await approveEventAction(fd);
    if (res?.error) {
      toast.error(res.error);
      router.refresh();
    } else {
      toast.success(`"${eventItem.title}" approved! (+100 ET points)`);
    }
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!rejectModalEvent) return;
    setIsRejecting(true);

    const fd = new FormData();
    fd.set("eventId", rejectModalEvent.id);
    if (rejectNotes.trim()) {
      fd.set("reason", rejectNotes.trim());
    }

    // Optimistic update
    setPendingEvents((prev) => prev.filter((e) => e.id !== rejectModalEvent.id));
    setEvents((prev) =>
      prev.map((e) =>
        e.id === rejectModalEvent.id
          ? { ...e, status: "rejected", admin_notes: rejectNotes.trim() }
          : e
      )
    );
    setStats((prev) => ({
      ...prev,
      pendingEvents: Math.max(0, prev.pendingEvents - 1),
    }));

    const res = await rejectEventAction(fd);
    setIsRejecting(false);
    setRejectModalEvent(null);
    setRejectNotes("");

    if (res?.error) {
      toast.error(res.error);
      router.refresh();
    } else {
      toast.success("Event rejected successfully");
    }
  };

  // Toggle Event Featured
  const handleToggleEventFeatured = async (eventId: string, currentFeatured: boolean) => {
    const nextFeatured = !currentFeatured;
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, is_featured: nextFeatured } : e))
    );

    const fd = new FormData();
    fd.set("event_id", eventId);
    fd.set("is_featured", nextFeatured.toString());
    const res = await toggleFeaturedAction(fd);
    if (res?.error) {
      toast.error(res.error);
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, is_featured: currentFeatured } : e))
      );
    } else {
      toast.success(nextFeatured ? "Event featured ⭐" : "Event unfeatured");
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));

    const fd = new FormData();
    fd.set("eventId", eventId);
    try {
      await deleteEventAction(fd);
      toast.success("Event deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete event");
      router.refresh();
    }
  };

  // Update Feedback Status
  const handleFeedbackStatus = async (feedbackId: string, newStatus: "reviewed" | "resolved") => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus } : f))
    );

    const fd = new FormData();
    fd.set("feedbackId", feedbackId);
    fd.set("status", newStatus);
    const res = await updateFeedbackStatusAction(fd);
    if (res?.error) {
      toast.error(res.error);
      router.refresh();
    } else {
      toast.success(`Marked feedback as ${newStatus}`);
    }
  };

  // Toggle User Role
  const handleToggleUserRole = async (targetUser: any) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    const actionLabel = newRole === "admin" ? "promote to Admin" : "demote to User";
    if (!window.confirm(`Are you sure you want to ${actionLabel} for "${targetUser.full_name || targetUser.username}"?`)) {
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
    );

    const fd = new FormData();
    fd.set("userId", targetUser.id);
    fd.set("role", newRole);
    const res = await updateUserRoleAction(fd);
    if (res?.error) {
      toast.error(res.error);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: targetUser.role } : u))
      );
    } else {
      toast.success(`Role updated to ${newRole.toUpperCase()}`);
    }
  };

  // Dismiss Report
  const handleDismissReport = async (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: "dismissed" } : r))
    );
    setStats((prev) => ({ ...prev, openReports: Math.max(0, prev.openReports - 1) }));

    const fd = new FormData();
    fd.set("reportId", reportId);
    try {
      await resolveReportAction(fd);
      toast.success("Report dismissed (Safe)");
    } catch (err: any) {
      toast.error(err?.message || "Failed to dismiss report");
      router.refresh();
    }
  };

  // Take Down & Punish Curator
  const handleTakeDownAndPunish = async (reportId: string) => {
    if (!window.confirm("Remove this event and resolve report with penalty check?")) return;

    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r))
    );
    setStats((prev) => ({ ...prev, openReports: Math.max(0, prev.openReports - 1) }));

    const fd = new FormData();
    fd.set("reportId", reportId);
    try {
      const res = await punishCuratorAction(fd);
      if (res && "error" in res && (res as any).error) {
        toast.error((res as any).error);
        router.refresh();
      } else {
        toast.success((res as any)?.note || "Event taken down and report resolved");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to take down event");
      router.refresh();
    }
  };

  // Add College
  const handleAddCollegeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim()) {
      toast.error("Please enter a college name");
      return;
    }

    setIsAddingCollege(true);
    const fd = new FormData();
    fd.set("name", collegeName.trim());
    fd.set("state", collegeState.trim());
    fd.set("website", collegeWebsite.trim());

    const res = await addCollegeAdminAction(fd);
    setIsAddingCollege(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`College "${collegeName}" added successfully`);
      if (res?.data) {
        setColleges((prev) => [res.data, ...prev]);
        setStats((prev) => ({ ...prev, collegesCount: prev.collegesCount + 1 }));
      }
      setShowAddCollege(false);
      setCollegeName("");
      setCollegeState("");
      setCollegeWebsite("");
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      // Status filter
      if (eventStatusFilter === "featured" && !item.is_featured) return false;
      if (eventStatusFilter === "approved" && item.status !== "approved") return false;
      if (eventStatusFilter === "pending" && item.status !== "pending") return false;
      if (eventStatusFilter === "rejected" && item.status !== "rejected") return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesCity = item.city?.toLowerCase().includes(q);
        const matchesCategory = item.category?.toLowerCase().includes(q);
        return matchesTitle || matchesCity || matchesCategory;
      }
      return true;
    });
  }, [events, eventStatusFilter, searchQuery]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Filtered Colleges
  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) return colleges;
    const q = searchQuery.toLowerCase().trim();
    return colleges.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q)
    );
  }, [colleges, searchQuery]);

  // Tab definitions
  const tabs = [
    { id: "overview" as TabType, label: "Overview", count: null },
    { id: "pending" as TabType, label: "Pending", count: stats.pendingEvents },
    { id: "events" as TabType, label: "All Events", count: null },
    { id: "feedback" as TabType, label: "Feedback", count: stats.feedbackCount },
    { id: "users" as TabType, label: "Users", count: stats.totalUsers },
    { id: "reports" as TabType, label: "Reports", count: stats.openReports },
    { id: "colleges" as TabType, label: "Colleges", count: stats.collegesCount },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Switzer']">
      {/* STICKY TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Back to EvenTime"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#6C47FF]/10 flex items-center justify-center text-[#6C47FF]">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900 tracking-tight leading-tight">
                    ET98 Admin Console
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                    Directory moderation & system health
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#6C47FF]" : ""}`} />
              </button>

              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold font-['Outfit'] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Admin</span>
              </Link>
            </div>
          </div>

          {/* HORIZONTAL SEGMENTED PILL TABS */}
          <div className="border-t border-slate-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold font-['Outfit'] transition-all select-none ${
                      isActive
                        ? "bg-[#6C47FF] text-white shadow-sm"
                        : "bg-[#F1F5F9] text-[#64748B] hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN BODY AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ===================== OVERVIEW TAB ===================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900">
                  Directory Health & KPIs
                </h2>
                <span className="text-xs font-semibold text-slate-500">Live platform metrics</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Pending */}
                <button
                  type="button"
                  onClick={() => handleTabChange("pending")}
                  className="bg-white p-5 rounded-2xl border-2 border-[#F59E0B]/30 hover:border-[#F59E0B] shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#D97706]">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-wider text-[#D97706] bg-amber-50 px-2 py-0.5 rounded-md">
                      Action Needed
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black font-['Outfit'] text-slate-900 tracking-tight">
                    {stats.pendingEvents}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                    Pending Approvals →
                  </div>
                </button>

                {/* Active Events */}
                <button
                  type="button"
                  onClick={() => handleTabChange("events")}
                  className="bg-white p-5 rounded-2xl border-2 border-[#10B981]/30 hover:border-[#10B981] shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#059669]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-wider text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black font-['Outfit'] text-slate-900 tracking-tight">
                    {stats.activeEvents}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                    Active Events →
                  </div>
                </button>

                {/* Registered Users */}
                <button
                  type="button"
                  onClick={() => handleTabChange("users")}
                  className="bg-white p-5 rounded-2xl border-2 border-[#6C47FF]/30 hover:border-[#6C47FF] shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center text-[#6C47FF]">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-wider text-[#6C47FF] bg-[#6C47FF]/10 px-2 py-0.5 rounded-md">
                      Community
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black font-['Outfit'] text-slate-900 tracking-tight">
                    {stats.totalUsers}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                    Registered Users →
                  </div>
                </button>

                {/* Open Reports */}
                <button
                  type="button"
                  onClick={() => handleTabChange("reports")}
                  className="bg-white p-5 rounded-2xl border-2 border-[#EF4444]/30 hover:border-[#EF4444] shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#DC2626]">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-wider text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-md">
                      Queue
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black font-['Outfit'] text-slate-900 tracking-tight">
                    {stats.openReports}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                    Open Reports →
                  </div>
                </button>
              </div>
            </div>

            {/* Feature Switches */}
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900 mb-4">
                Feature Switches
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 p-6 shadow-sm">
                {/* Leaderboard Switch */}
                <div className="flex items-center justify-between py-3">
                  <div className="pr-4">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Curator Leaderboard
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Enable or disable public leaderboard ranking and points tally for curators.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleLeaderboard}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.leaderboardEnabled ? "bg-[#6C47FF]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.leaderboardEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Featured Carousel Switch */}
                <div className="flex items-center justify-between py-3 pt-4">
                  <div className="pr-4">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Featured Events Carousel
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Show or hide the highlighted events carousel on the public home screen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleFeaturedSetting}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.featuredEnabled ? "bg-[#6C47FF]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.featuredEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PENDING EVENTS TAB ===================== */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900">
                Pending Approval Queue ({pendingEvents.length})
              </h2>
            </div>

            {pendingEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-[#10B981] mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-slate-900">Queue All Clear!</h3>
                <p className="text-sm text-slate-500 mt-1">No pending events waiting for approval.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingEvents.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-[#EDE8FF] text-[#6C47FF] text-[11px] font-black font-['Outfit'] uppercase tracking-wider mb-2">
                            {item.category || "Event"}
                          </span>
                          <h3 className="text-base font-bold font-['Outfit'] text-slate-900 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.date_string || "TBA"} • {item.city || "Online"}
                          </p>
                          <p className="text-xs text-slate-600 mt-1.5">
                            Submitted by:{" "}
                            <span className="font-bold text-slate-900">
                              {item.profiles?.full_name || item.organizer_name || "Curator"}
                            </span>
                          </p>
                        </div>

                        <Link
                          href={`/events/${item.slug || item.id}?from=admin`}
                          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#6C47FF] hover:bg-[#EDE8FF] transition-colors shrink-0"
                          title="Preview Event"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>

                      {item.registration_link && (
                        <p className="text-[11px] text-slate-400 truncate mb-3">
                          {item.registration_link}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                      <button
                        type="button"
                        onClick={() => setRejectModalEvent({ id: item.id, title: item.title })}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 text-[#EF4444] text-xs font-bold font-['Outfit'] hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveEvent(item)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#10B981] text-white text-xs font-bold font-['Outfit'] hover:bg-[#059669] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve (+100 ET)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== ALL EVENTS TAB ===================== */}
        {activeTab === "events" && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search events by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF]"
                />
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { id: "all", label: "All" },
                  { id: "approved", label: "Approved" },
                  { id: "pending", label: "Pending" },
                  { id: "rejected", label: "Rejected" },
                  { id: "featured", label: "Featured ⭐" },
                ].map((f) => {
                  const isSelected = eventStatusFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setEventStatusFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold font-['Outfit'] whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-[#6C47FF] text-white"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List */}
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-500">No events match the selected criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className="text-base font-bold font-['Outfit'] text-slate-900 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.date_string || "Date TBA"} • {item.city || "Online"} • Status:{" "}
                            <span
                              className={`font-black uppercase tracking-wider ${
                                item.status === "approved"
                                  ? "text-[#059669]"
                                  : item.status === "rejected"
                                  ? "text-[#DC2626]"
                                  : "text-[#D97706]"
                              }`}
                            >
                              {item.status}
                            </span>
                          </p>
                        </div>

                        <Link
                          href={`/events/${item.slug || item.id}?from=admin`}
                          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#6C47FF] hover:bg-[#EDE8FF] transition-colors shrink-0"
                          title="Preview Event"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                      {/* Featured Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleEventFeatured(item.id, !!item.is_featured)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-colors ${
                          item.is_featured
                            ? "bg-amber-50 text-[#D97706] border border-amber-200"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Star
                          className="w-3.5 h-3.5"
                          fill={item.is_featured ? "#D97706" : "none"}
                        />
                        <span>{item.is_featured ? "Featured" : "Feature"}</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(item.id, item.title)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#EF4444] hover:bg-red-50 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== FEEDBACK TAB ===================== */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900">
                User Feedback & Bug Reports ({feedbacks.length})
              </h2>
            </div>

            {feedbacks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No feedback submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black font-['Outfit'] uppercase tracking-wider px-2.5 py-1 rounded-md ${
                            item.type === "bug"
                              ? "bg-red-50 text-[#DC2626]"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.type || "GENERAL"}
                        </span>

                        <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.status || "PENDING"}
                        </span>
                      </div>

                      <span className="text-xs text-slate-400">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                    </div>

                    <p className="text-sm text-slate-800 leading-relaxed">{item.message}</p>

                    {item.profiles?.email && (
                      <p className="text-xs text-slate-500">
                        From: <span className="font-semibold text-slate-700">{item.profiles.full_name}</span>{" "}
                        ({item.profiles.email})
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      {item.status !== "reviewed" && item.status !== "resolved" && (
                        <button
                          type="button"
                          onClick={() => handleFeedbackStatus(item.id, "reviewed")}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold font-['Outfit'] transition-colors"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      {item.status !== "resolved" && (
                        <button
                          type="button"
                          onClick={() => handleFeedbackStatus(item.id, "resolved")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold font-['Outfit'] transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== USERS TAB ===================== */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF]"
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No users found matching query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-[#6C47FF]/10 text-[#6C47FF] flex items-center justify-center font-bold text-base font-['Outfit'] shrink-0">
                        {(item.full_name || item.username || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold font-['Outfit'] text-slate-900 truncate">
                          {item.full_name || "Anonymous User"}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {item.email || `@${item.username}`}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          ET Score: <span className="font-black text-slate-900">{item.et_score || 0}</span> •{" "}
                          Role:{" "}
                          <span
                            className={`font-bold ${
                              item.role === "admin" ? "text-[#6C47FF]" : "text-slate-500"
                            }`}
                          >
                            {item.role?.toUpperCase() || "USER"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {item.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleToggleUserRole(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] shrink-0 transition-colors ${
                          item.role === "admin"
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-[#6C47FF]/10 text-[#6C47FF] hover:bg-[#6C47FF]/20"
                        }`}
                      >
                        {item.role === "admin" ? "Demote" : "Make Admin"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== REPORTS TAB ===================== */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900">
                Community Reports Queue ({reports.length})
              </h2>
            </div>

            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-[#10B981] mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold font-['Outfit'] text-slate-900">No Active Reports</h3>
                <p className="text-sm text-slate-500 mt-1">The EvenTime community is clean and safe.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-wider px-2.5 py-1 rounded-md bg-red-50 text-[#DC2626]">
                        {item.reason || "REPORT"}
                      </span>

                      <span
                        className={`text-[10px] font-black font-['Outfit'] uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.status === "resolved"
                            ? "bg-emerald-50 text-[#059669]"
                            : item.status === "dismissed"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-50 text-[#D97706]"
                        }`}
                      >
                        {item.status || "PENDING"}
                      </span>
                    </div>

                    <Link
                      href={item.event_id ? `/events/${item.events?.slug || item.event_id}?from=admin` : "#"}
                      className="block text-base font-bold font-['Outfit'] text-slate-900 hover:text-[#6C47FF] transition-colors"
                    >
                      {item.events?.title || "Unknown Event"} →
                    </Link>

                    <p className="text-xs text-slate-500">
                      Reported by: <span className="font-semibold text-slate-700">{item.reporter?.full_name || "User"}</span>{" "}
                      ({item.reporter?.email || "N/A"}) •{" "}
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </p>

                    {item.status === "pending" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleDismissReport(item.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold font-['Outfit'] transition-colors"
                        >
                          Dismiss (Safe)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTakeDownAndPunish(item.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#EF4444] text-white hover:bg-[#DC2626] text-xs font-bold font-['Outfit'] transition-colors shadow-sm"
                        >
                          Take Down & Punish
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== COLLEGES TAB ===================== */}
        {activeTab === "colleges" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddCollege(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6C47FF] text-white text-xs sm:text-sm font-bold font-['Outfit'] hover:bg-[#5835E5] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add College</span>
              </button>
            </div>

            {filteredColleges.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No colleges found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
                {filteredColleges.map((college, idx) => (
                  <div
                    key={college.id || idx}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-6 text-xs font-black font-['Outfit'] text-slate-400 text-right">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold font-['Outfit'] text-slate-900">
                          {college.name}
                        </h3>
                        {college.state && (
                          <p className="text-xs text-slate-500 mt-0.5">{college.state}</p>
                        )}
                      </div>
                    </div>

                    {college.website && (
                      <a
                        href={college.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#6C47FF] hover:underline flex items-center gap-1"
                      >
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ===================== REJECT MODAL ===================== */}
      {rejectModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold font-['Outfit'] text-slate-900">Reject Event</h3>
              <button
                type="button"
                onClick={() => setRejectModalEvent(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Rejecting <span className="font-bold text-slate-900">"{rejectModalEvent.title}"</span>. You can optionally include feedback for the curator.
            </p>

            <textarea
              rows={3}
              placeholder="Reason for rejection (optional)..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 mb-4 resize-none"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isRejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD COLLEGE MODAL ===================== */}
      {showAddCollege && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCollegeSubmit}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold font-['Outfit'] text-slate-900">Add New College</h3>
              <button
                type="button"
                onClick={() => setShowAddCollege(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Add an academic institution to the EvenTime directory for campus categorization.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold font-['Outfit'] text-slate-700 mb-1">
                  College Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Osmania University"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-['Outfit'] text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g., Telangana"
                  value={collegeState}
                  onChange={(e) => setCollegeState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-['Outfit'] text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={collegeWebsite}
                  onChange={(e) => setCollegeWebsite(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCollege(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingCollege}
                className="px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] bg-[#6C47FF] text-white hover:bg-[#5835E5] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isAddingCollege ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save College</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
