"use client";

import React, { useState, useEffect, useCallback, useMemo, useDeferredValue, useRef } from "react";
import Image from "next/image";
import { useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  X,
  CalendarDays,
  ChevronDown,
  Check,
  RotateCcw,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { EventGrid } from "@/lib/home/EventGrid";
import { createClient } from "@/lib/supabase/client";
import { CITIES } from "@/lib/constants/cities";
import { categoriesList } from "@/features/create-event/constants";
import { parseEventDateString } from "@/lib/utils/date";
import { eventSync } from "@/lib/events/eventSync";
import type { EventRow, ProfileRow } from "@/types";

export function SearchClient({ initialEvents = [] }: { initialEvents?: Partial<EventRow>[] } = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  // URL query params initialization
  const initialQ = searchParams.get("q") || "";
  const initialCity = searchParams.get("city") || null;
  const initialCategory = searchParams.get("category") || null;
  const initialDate = searchParams.get("date") || null;

  const [keyword, setKeyword] = useState(initialQ);
  const deferredKeyword = useDeferredValue(keyword);
  const [selectedCity, setSelectedCity] = useState<string | null>(initialCity);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [displayLimit, setDisplayLimit] = useState(16);

  // Desktop dropdown states
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Mobile bottom sheet modal states
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Data states — initialized with server-cached buffet (0 direct DB calls)
  const [allEvents, setAllEvents] = useState<Partial<EventRow>[]>(initialEvents);
  const [profile, setProfile] = useState<Partial<ProfileRow> | null>(null);
  const [isLoading, setIsLoading] = useState(initialEvents.length === 0);

  // Helper date generators matching app
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();

  // Close desktop dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch approved events with relations
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, slug, title, category, date_string, start_time, end_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, target_audience, is_virtual, college_only, college_id, colleges(name), profiles(username, full_name), description, interested_events(count)"
        )
        .eq("status", "approved")
        .or("college_only.is.null,college_only.eq.false")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[SearchClient] Fetch events error:", error);
      } else {
        setAllEvents(data || []);
      }
    } catch (err) {
      console.error("[SearchClient] Unexpected fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Reactive client-side deletion sync
  useEffect(() => {
    const unsubscribe = eventSync.subscribe((payload) => {
      if (payload.type === "delete") {
        setAllEvents((prev) => prev.filter((e) => e.id !== payload.eventId && e.slug !== payload.eventId));
      }
    });
    return unsubscribe;
  }, []);

  // Fetch current user profile
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, college, branch, graduation_year, goals, preferred_cities, role, user_type")
          .eq("id", user.id)
          .maybeSingle();
        if (prof) setProfile(prof);
      }
    };
    if (initialEvents.length === 0) {
      fetchEvents();
    }
    fetchUser();
  }, [supabase, fetchEvents, initialEvents.length]);

  // Sync state from URL params when navigation occurs (e.g. from Navbar quick filters, Home search, or browser history)
  useEffect(() => {
    const qParam = searchParams.get("q") || "";
    const cityParam = searchParams.get("city") || null;
    const categoryParam = searchParams.get("category") || null;
    const dateParam = searchParams.get("date") || null;

    setKeyword((prev) => (prev !== qParam ? qParam : prev));
    setSelectedCity((prev) => (prev !== cityParam ? cityParam : prev));
    setSelectedCategory((prev) => (prev !== categoryParam ? categoryParam : prev));
    setSelectedDate((prev) => (prev !== dateParam ? dateParam : prev));
  }, [searchParams]);

  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get("q") || "";
      const city = sp.get("city") || null;
      const cat = sp.get("category") || null;
      const dt = sp.get("date") || null;
      setKeyword(q);
      setSelectedCity(city);
      setSelectedCategory(cat);
      setSelectedDate(dt);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync state changes to browser URL seamlessly
  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredKeyword.trim()) params.set("q", deferredKeyword.trim());
    if (selectedCity) params.set("city", selectedCity);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);

    const newQuery = params.toString();
    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
    window.history.replaceState(null, "", newUrl);
  }, [deferredKeyword, selectedCity, selectedCategory, selectedDate, pathname]);

  // Calculate live dynamic counts across upcoming platform events
  const { categoryCounts, cityCounts } = useMemo(() => {
    const catMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allEvents.forEach((row) => {
      const parsed = parseEventDateString(row.date_string || "");
      let isUpcomingOrToday = false;
      if (parsed) {
        const evDate = new Date(parsed);
        evDate.setHours(0, 0, 0, 0);
        isUpcomingOrToday = evDate.getTime() >= today.getTime();
      }

      if (isUpcomingOrToday) {
        if (row.category) {
          catMap[row.category] = (catMap[row.category] || 0) + 1;
        }
        if (row.city) {
          cityMap[row.city] = (cityMap[row.city] || 0) + 1;
        }
      }
    });

    return { categoryCounts: catMap, cityCounts: cityMap };
  }, [allEvents]);

  // Comprehensive 9-field multi-attribute filtering matching SearchScreen.tsx
  const filteredEvents = useMemo(() => {
    let pool = [...allEvents];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. By default, strictly exclude past events (unless user picked a specific date via calendar)
    if (!selectedDate) {
      pool = pool.filter((ev) => {
        const parsed = parseEventDateString(ev.date_string || "");
        if (!parsed) return false;
        const evDate = new Date(parsed);
        evDate.setHours(0, 0, 0, 0);
        return evDate.getTime() >= today.getTime();
      });
    }

    // 2. 9-Field Keyword Matching
    if (deferredKeyword.trim()) {
      const q = deferredKeyword.trim().toLowerCase();
      pool = pool.filter((ev: any) => {
        const title = (ev.title || "").toLowerCase();
        const category = (ev.category || "").toLowerCase();
        const city = (ev.city || "").toLowerCase();
        const location = (ev.location || "").toLowerCase();
        const organizer = (ev.organizer_name || "").toLowerCase();
        const college = (ev.colleges?.name || "").toLowerCase();
        const curatorUsername = (ev.profiles?.username || "").toLowerCase();
        const curatorName = (ev.profiles?.full_name || "").toLowerCase();
        const description = (ev.description || "").toLowerCase();

        return (
          title.includes(q) ||
          category.includes(q) ||
          city.includes(q) ||
          location.includes(q) ||
          organizer.includes(q) ||
          college.includes(q) ||
          curatorUsername.includes(q) ||
          curatorName.includes(q) ||
          description.includes(q)
        );
      });
    }

    // 3. City Filter
    if (selectedCity) {
      const targetCity = selectedCity.toLowerCase().trim();
      pool = pool.filter((ev) => ev.city?.toLowerCase().trim() === targetCity);
    }

    // 4. Category Filter
    if (selectedCategory) {
      const targetCat = selectedCategory.toLowerCase().trim();
      pool = pool.filter((ev) => ev.category?.toLowerCase().trim() === targetCat);
    }

    // 5. Calendar Date Filter
    if (selectedDate) {
      pool = pool.filter((ev) => {
        const parsed = parseEventDateString(ev.date_string || "");
        if (!parsed) return false;
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, "0");
        const d = String(parsed.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}` === selectedDate;
      });
    }

    // Sort chronologically (earliest upcoming first)
    pool.sort((a, b) => {
      const da = parseEventDateString(a.date_string || "")?.getTime() || 0;
      const db = parseEventDateString(b.date_string || "")?.getTime() || 0;
      return da - db;
    });

    return pool;
  }, [allEvents, deferredKeyword, selectedCity, selectedCategory, selectedDate]);

  // Reset limit when filters change
  useEffect(() => {
    setDisplayLimit(16);
  }, [deferredKeyword, selectedCity, selectedCategory, selectedDate]);

  const visibleEvents = useMemo(() => {
    return filteredEvents.slice(0, displayLimit);
  }, [filteredEvents, displayLimit]);

  const hasActiveFilters = Boolean(
    keyword.trim() || selectedCity || selectedCategory || selectedDate
  );

  const clearAllFilters = () => {
    setKeyword("");
    setSelectedCity(null);
    setSelectedCategory(null);
    setSelectedDate(null);
    setShowCityDropdown(false);
    setShowCategoryDropdown(false);
    setShowDateDropdown(false);
    setShowCityModal(false);
    setShowCategoryModal(false);
    setShowDateModal(false);
    searchInputRef.current?.focus();
  };

  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return CITIES;
    return CITIES.filter((c) =>
      c.toLowerCase().includes(citySearchQuery.trim().toLowerCase())
    );
  }, [citySearchQuery]);

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoriesList;
    return categoriesList.filter((c) =>
      c.toLowerCase().includes(categorySearchQuery.trim().toLowerCase())
    );
  }, [categorySearchQuery]);

  // Responsive trigger handlers
  const handleCityClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setShowCityModal(true);
    } else {
      setShowCityDropdown((prev) => !prev);
      setShowCategoryDropdown(false);
      setShowDateDropdown(false);
    }
  };

  const handleCategoryClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setShowCategoryModal(true);
    } else {
      setShowCategoryDropdown((prev) => !prev);
      setShowCityDropdown(false);
      setShowDateDropdown(false);
    }
  };

  const handleDateClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setShowDateModal(true);
    } else {
      setShowDateDropdown((prev) => !prev);
      setShowCityDropdown(false);
      setShowCategoryDropdown(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-base pb-28 sm:pb-24">
      {/* Top navbar: visible on desktop, hidden on mobile for /search */}
      <Navbar searchValue={keyword} onSearchChange={setKeyword} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Mobile Search Bar: only visible on mobile screens where Navbar is hidden */}
        <div className="block sm:hidden max-w-3xl mx-auto mb-3">
          <div className="relative flex items-center bg-white rounded-full border border-slate-200/80 shadow-sm transition-all focus-within:ring-4 focus-within:ring-brand-primary/10 focus-within:border-brand-primary">
            <button
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              className="p-0 ml-3.5 bg-transparent border-none cursor-pointer flex items-center justify-center shrink-0 text-slate-400 hover:text-brand-primary transition-colors"
              aria-label="Focus search"
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search hackathons, meetups..."
              maxLength={100}
              className="w-full bg-transparent py-2.5 pl-3 pr-10 text-slate-900 placeholder:text-slate-400 font-medium text-sm outline-none"
            />
            {keyword.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setKeyword("");
                  searchInputRef.current?.focus();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors mr-2 shrink-0 cursor-pointer"
                aria-label="Clear search text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips Bar Container */}
        <div className="max-w-3xl sm:max-w-none mx-auto mb-4 sm:mb-6">
          {/* Quick Filter Chips Bar: horizontal scroll on mobile, unclipped overflow on desktop */}
          <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* 1. Date Dropdown Chip */}
            <div className="relative shrink-0" ref={dateDropdownRef}>
              <button
                type="button"
                onClick={handleDateClick}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  selectedDate
                    ? "bg-[#6C47FF] text-white border-[#6C47FF] shadow-sm shadow-[#6C47FF]/20"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <CalendarDays className={`w-3.5 h-3.5 ${selectedDate ? "text-white" : "text-[#6C47FF]"}`} />
                <span>
                  {selectedDate
                    ? new Date(selectedDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })
                    : "Date"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 ${selectedDate ? "text-white" : "text-slate-400"}`} />
              </button>

              {/* Desktop Date Popover */}
              {showDateDropdown && (
                <div className="hidden sm:block absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Date</span>
                    {selectedDate && (
                      <button
                        onClick={() => {
                          setSelectedDate(null);
                          setShowDateDropdown(false);
                        }}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={selectedDate || ""}
                    onChange={(e) => {
                      setSelectedDate(e.target.value || null);
                      setShowDateDropdown(false);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-brand-primary mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(todayStr);
                        setShowDateDropdown(false);
                      }}
                      className="flex-1 py-1.5 bg-purple-50 text-brand-primary text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(tomorrowStr);
                        setShowDateDropdown(false);
                      }}
                      className="flex-1 py-1.5 bg-purple-50 text-brand-primary text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Today Chip */}
            <button
              type="button"
              onClick={() => setSelectedDate((prev) => (prev === todayStr ? null : todayStr))}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedDate === todayStr
                  ? "bg-[#6C47FF] text-white border-[#6C47FF] shadow-sm shadow-[#6C47FF]/20"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              Today
            </button>

            {/* 3. Tomorrow Chip */}
            <button
              type="button"
              onClick={() => setSelectedDate((prev) => (prev === tomorrowStr ? null : tomorrowStr))}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedDate === tomorrowStr
                  ? "bg-[#6C47FF] text-white border-[#6C47FF] shadow-sm shadow-[#6C47FF]/20"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              Tomorrow
            </button>

            {/* 4. City Dropdown Chip */}
            <div className="relative shrink-0" ref={cityDropdownRef}>
              <button
                type="button"
                onClick={handleCityClick}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  selectedCity
                    ? "bg-[#6C47FF] text-white border-[#6C47FF] shadow-sm shadow-[#6C47FF]/20"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <span>
                  {selectedCity
                    ? `${selectedCity}${cityCounts[selectedCity] ? ` (${cityCounts[selectedCity]})` : ""}`
                    : "City"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 ${selectedCity ? "text-white" : "text-slate-400"}`} />
              </button>

              {/* Desktop City Popover */}
              {showCityDropdown && (
                <div className="hidden sm:block absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by City</span>
                    {selectedCity && (
                      <button
                        onClick={() => {
                          setSelectedCity(null);
                          setShowCityDropdown(false);
                        }}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    placeholder="Search city..."
                    maxLength={50}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-brand-primary mb-2"
                  />
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {filteredCities.map((city) => {
                      const count = cityCounts[city] || 0;
                      const isSelected = selectedCity === city;
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setSelectedCity(isSelected ? null : city);
                            setShowCityDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-purple-50 text-brand-primary font-bold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{city}</span>
                          {count > 0 && (
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                isSelected
                                  ? "bg-brand-primary text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Category Dropdown Chip */}
            <div className="relative shrink-0" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={handleCategoryClick}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  selectedCategory
                    ? "bg-[#6C47FF] text-white border-[#6C47FF] shadow-sm shadow-[#6C47FF]/20"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <span>
                  {selectedCategory
                    ? `${selectedCategory}${categoryCounts[selectedCategory] ? ` (${categoryCounts[selectedCategory]})` : ""}`
                    : "Category"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 ${selectedCategory ? "text-white" : "text-slate-400"}`} />
              </button>

              {/* Desktop Category Popover */}
              {showCategoryDropdown && (
                <div className="hidden sm:block absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by Category</span>
                    {selectedCategory && (
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setShowCategoryDropdown(false);
                        }}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {categoriesList.map((cat) => {
                      const count = categoryCounts[cat] || 0;
                      const isSelected = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(isSelected ? null : cat);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-purple-50 text-brand-primary font-bold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate pr-2">{cat}</span>
                          {count > 0 && (
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                                isSelected
                                  ? "bg-brand-primary text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Reset Filters Chip */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                aria-label="Reset all search filters"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse mt-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-100 rounded-3xl" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-14 sm:py-20 px-4">
            <div className="relative w-44 h-44 mx-auto mb-4">
              <Image
                src="/illustrations/search_state.webp"
                alt="No events found"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h3 className="font-heading font-bold text-xl text-slate-900 mb-2 font-['Outfit']">
              No matching events found
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto font-['Switzer',sans-serif] mb-6">
              Try searching for a different keyword, category, city, or curator name.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-full transition-all active:scale-95 shadow-md shadow-brand-primary/20"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 sm:mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                {hasActiveFilters
                  ? `${filteredEvents.length} ${filteredEvents.length === 1 ? "Event" : "Events"} Found`
                  : `Upcoming Events & Opportunities (${filteredEvents.length})`}
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                >
                  Reset all
                </button>
              )}
            </div>

            <EventGrid
              events={visibleEvents}
              profile={profile}
              gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              isPastDateView={Boolean(selectedDate)}
            />

            {/* Load More Button */}
            {displayLimit < filteredEvents.length && (
              <div className="text-center mt-12 mb-6">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 16)}
                  className="px-6 py-3 bg-white hover:bg-purple-50 hover:text-brand-primary text-slate-700 font-bold text-sm rounded-full border border-slate-200/80 shadow-sm transition-all active:scale-95"
                >
                  Load More Events ({filteredEvents.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM SHEET MODALS (NATIVE APP PARITY)             */}
      {/* ========================================================= */}

      {/* 1. Mobile City Picker Modal */}
      {showCityModal && (
        <div className="sm:hidden fixed inset-0 z-[200] flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCityModal(false)}
          />
          <div className="relative bg-white rounded-t-3xl max-h-[82vh] p-5 flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-lg text-slate-900 font-['Outfit']">Select City</h3>
              <button
                type="button"
                onClick={() => setShowCityModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search input */}
            <div className="relative my-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder="Search Indian cities..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 font-medium outline-none focus:border-brand-primary"
              />
              {citySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCitySearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Cities List */}
            <div className="overflow-y-auto max-h-72 space-y-1 pr-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCity(null);
                  setShowCityModal(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  !selectedCity ? "bg-purple-50 text-brand-primary" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>All Cities</span>
                {!selectedCity && <Check className="w-4 h-4 text-brand-primary" />}
              </button>
              {filteredCities.map((c) => {
                const count = cityCounts[c] || 0;
                const isSelected = selectedCity === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedCity(isSelected ? null : c);
                      setShowCityModal(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isSelected ? "bg-purple-50 text-brand-primary" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{c}</span>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            isSelected ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-brand-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Mobile Category Picker Modal */}
      {showCategoryModal && (
        <div className="sm:hidden fixed inset-0 z-[200] flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCategoryModal(false)}
          />
          <div className="relative bg-white rounded-t-3xl max-h-[82vh] p-5 flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-lg text-slate-900 font-['Outfit']">Select Category</h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search input */}
            <div className="relative my-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 font-medium outline-none focus:border-brand-primary"
              />
              {categorySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Categories List */}
            <div className="overflow-y-auto max-h-72 space-y-1 pr-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoryModal(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  !selectedCategory ? "bg-purple-50 text-brand-primary" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>All Categories</span>
                {!selectedCategory && <Check className="w-4 h-4 text-brand-primary" />}
              </button>
              {filteredCategories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(isSelected ? null : cat);
                      setShowCategoryModal(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isSelected ? "bg-purple-50 text-brand-primary" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{cat}</span>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            isSelected ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-brand-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Mobile Date Picker Modal */}
      {showDateModal && (
        <div className="sm:hidden fixed inset-0 z-[200] flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDateModal(false)}
          />
          <div className="relative bg-white rounded-t-3xl p-5 flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-lg text-slate-900 font-['Outfit']">Select Date</h3>
              <button
                type="button"
                onClick={() => setShowDateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick date buttons */}
            <div className="grid grid-cols-2 gap-2 my-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayStr);
                  setShowDateModal(false);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedDate === todayStr
                    ? "bg-[#6C47FF] text-white border-[#6C47FF]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(tomorrowStr);
                  setShowDateModal(false);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedDate === tomorrowStr
                    ? "bg-[#6C47FF] text-white border-[#6C47FF]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50"
                }`}
              >
                Tomorrow
              </button>
            </div>

            {/* Native date input */}
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Or pick specific date
            </label>
            <input
              type="date"
              value={selectedDate || ""}
              onChange={(e) => {
                setSelectedDate(e.target.value || null);
                setShowDateModal(false);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium outline-none focus:border-brand-primary mb-3"
            />

            {selectedDate && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  setShowDateModal(false);
                }}
                className="w-full py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                Clear Date Filter
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
