"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { AuthUser, ProfileRow, CollegeRow } from "@/types";
import { createCollegeAction } from "@/app/profile/action"; // NEW: Import Server Action
import { CITIES } from "@/lib/constants/cities";
import { toast } from "sonner"; // NEW: Added toast import
import { categoriesList } from "@/features/create-event/constants";
import { INDIAN_COLLEGE_BRANCHES } from "@/lib/constants/branches";
import { DelayedPrompt } from "./DelayedActionModal"; // NEW: Clean extracted component

export interface OnboardingProps {
  user: AuthUser | null;
  profile: Partial<ProfileRow> | null;
}

export function OnboardingModal({ user, profile }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<string[]>([]); // NEW: City state (max 3, same as profile settings)

  const toggleCity = (cityName: string) => {
    if (cities.includes(cityName)) {
      setCities(cities.filter(c => c !== cityName));
    } else if (cities.length < 3) {
      setCities([...cities, cityName]);
    }
  };
  const [college, setCollege] = useState("");
  const [collegeId, setCollegeId] = useState<string | null>(null); // NEW: Safe database storage state pointer
  const [collegesList, setCollegesList] = useState<CollegeRow[]>([]); // NEW: Master dataset store array array
  const [searchQuery, setSearchQuery] = useState(""); // NEW: Handles input display dynamically
  const [showDropdown, setShowDropdown] = useState(false); // NEW: Controls clean panel presentation states
  
  const [role, setRole] = useState("");

  const [year, setYear] = useState("");
  const [yearSearchQuery, setYearSearchQuery] = useState("");
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [yearList, setYearList] = useState(["2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"]);

  const [branch, setBranch] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [username, setUsername] = useState("");
const [isSaving, setIsSaving] = useState(false);
const [isCreatingCollege, setIsCreatingCollege] = useState(false); // NEW: Notion-style loader
  const [isSearchingColleges, setIsSearchingColleges] = useState(false); // NEW: live search loader  
  // NEW: State to control manual appearance from banner
  // Signed-in but not-onboarded users get the modal right away (forced).
  // Guests still go through DelayedPrompt's soft, dismissible teaser.
  const [isModalOpen, setIsModalOpen] = useState(!!user); 
  
  const router = useRouter();
  const supabase = createClient();

  // NEW: Click outside handler to close all dropdowns
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false);
      setShowYearDropdown(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // UPDATED: Live server-side search (debounced) instead of loading all 54k colleges
  useEffect(() => {
    const query = searchQuery.trim();
    if (!user || profile?.is_onboarded || !query) {
      setCollegesList([]);
      return;
    }
    setIsSearchingColleges(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("colleges")
        .select("id, name, slug, state")
        .ilike("name", `%${query}%`)
        .order("name", { ascending: true })
        .limit(10);
      setCollegesList((data as CollegeRow[]) || []);
      setIsSearchingColleges(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user, profile]);

  // Hide everything if already onboarded
  if (profile?.is_onboarded) return null;

  // If modal is not manually opened yet, show the new isolated clean popup
  if (!isModalOpen) {
    return <DelayedPrompt user={user} profile={profile} onOpen={() => setIsModalOpen(true)} />;
  }

  // NEW: Notion-style Create College Function via Server Action
  const handleCreateCollege = async (newCollegeName: string) => {
    setIsCreatingCollege(true);
    
    // Call the secure server action instead of hitting the DB directly
    const result = await createCollegeAction(newCollegeName);

    if (result.data && !result.error) {
      // Cast to CollegeRow in case your type requires specific fields returning from action
      setCollegesList(prev => [...prev, result.data as CollegeRow]); 
      setCollege(result.data.name);
      setCollegeId(result.data.id);
      setSearchQuery(result.data.name);
    } else {
      console.error("Failed to add college:", result.error);
    }
    
    setIsCreatingCollege(false);
    setShowDropdown(false);
  };

  const handleSave = async () => {
    // Guest user try chesthe login page ki pampiddam
    if (!user) {
      toast.error("Please sign in to complete your profile!");
      router.push("/login"); // Note: Change "/login" if your auth route is different
      return;
    }

    setIsSaving(true);
    
    const updatePayload = {
      preferred_cities: cities,
      college: role === "Student" ? college : null,
      college_id: role === "Student" ? collegeId : null,
      graduation_year: role === "Student" ? year : null,
      branch: role === "Student" ? branch : null,
      user_type: role === "Student" ? 'student' : role.toLowerCase(),
      goals: categories.slice(0, 6),
      is_onboarded: true,
      ...(username.trim() ? { username: username.trim().toLowerCase() } : {}),
    };


    // FIXED: Changed `as unknown as Partial<ProfileRow>` to `as any` to prevent the Type 'never' compilation error
    const { error } = await supabase.from("profiles").update(updatePayload as any).eq("id", user.id);
    
    if (error) {
      toast.error("Failed to save. Please try again.");
      setIsSaving(false);
      return;
    }
    
    // Immediately navigate — the animation IS the feedback
    router.refresh();
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Modal Overlay — no close-on-click: onboarding is mandatory, not dismissible */}
      <div className="absolute inset-0 bg-slate-900/60" />
       <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 max-h-[90vh] overflow-y-auto p-8 custom-scrollbar"
      >
        <AnimatePresence mode="wait">
          
          {/* STEP 1: The Welcome */}
          {step === 1 && !isSaving && (
            <motion.div key="step1" exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto text-brand-primary">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-extrabold text-text-primary">Almost there.</h2>
                <p className="text-text-secondary mt-2 font-medium">One profile, and we&apos;ll filter out everything that doesn&apos;t matter to you.</p>
              </div>
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-text-primary hover:bg-black text-white py-4 rounded-full font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Let's setup <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: The Details */}
          {step === 2 && !isSaving && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-xl font-heading font-extrabold text-text-primary">Tell us about yourself</h2>
              
              <div className="space-y-4">
                {/* 0. Username */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pick a username <span className="text-text-secondary font-normal normal-case">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. john_doe"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    className="w-full bg-surface-base border-none rounded-xl px-4 py-4 text-text-primary focus:ring-2 focus:ring-brand-primary/20 outline-none font-medium placeholder:text-text-secondary"
                  />
                </div>

                {/* 1. Location Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Which location's events do you want to see? <span className="text-text-secondary font-normal normal-case">(pick up to 3)</span></label>
                  {cities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cities.map(c => (
                        <span key={c} className="inline-flex items-center gap-1.5 bg-text-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">
                          {c}
                          <button type="button" onClick={() => toggleCity(c)} className="hover:text-red-300 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {CITIES.map(loc => {
                      const isSelected = cities.includes(loc);
                      const isDisabled = !isSelected && cities.length >= 3;
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleCity(loc)}
                          disabled={isDisabled}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            isSelected
                              ? "bg-text-primary text-white border-text-primary"
                              : isDisabled
                              ? "bg-surface-base text-slate-300 border-transparent cursor-not-allowed"
                              : "bg-surface-base text-slate-600 border-transparent hover:bg-slate-200"
                          }`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Role Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">What are you?</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-surface-base border-none rounded-xl px-4 py-4 text-text-primary focus:ring-2 focus:ring-brand-primary/20 outline-none font-medium"
                  >
                    <option value="" disabled>Select Role</option>
                    {["Founder", "Investor", "Student", "Recent Graduate", "Professional", "Prefer not to say"].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Conditional College, Year (Only if Student) */}
                <AnimatePresence>
                  {role === "Student" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-visible">
                      
                      <p className="text-xs text-text-secondary font-medium -mt-1">Add your college — and we&apos;ll surface what&apos;s happening on your own campus first.</p>

                      {/* COLLEGE SELECTOR */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text" 
                          placeholder="Search & Select Your College" 
                          value={searchQuery} 
                          onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                          onFocus={() => setShowDropdown(true)}
                          className="w-full bg-surface-base border-none rounded-xl px-4 py-4 text-text-primary focus:ring-2 focus:ring-brand-primary/20 outline-none font-medium placeholder:text-text-secondary"
                        />
                        {showDropdown && searchQuery.trim().length > 0 && (
                          <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl z-50 no-scrollbar flex flex-col">
                            {isSearchingColleges && (
                              <div className="px-4 py-3 text-sm text-slate-400 font-medium">Searching...</div>
                            )}
                            {!isSearchingColleges && collegesList.map(item => (
                                <button key={item.id} type="button" onClick={() => { setCollege(item.name); setCollegeId(item.id); setSearchQuery(item.name); setShowDropdown(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-brand-primary/5 hover:text-brand-primary transition-colors border-b border-slate-50 last:border-none">
                                  🏢 {item.name} {item.state ? <span className="text-[10px] text-slate-400 font-bold uppercase float-right">{item.state}</span> : null}
                                </button>
                              ))}
                            {!isSearchingColleges && !collegesList.some(item => item.name.toLowerCase() === searchQuery.toLowerCase().trim()) && (
                              <button type="button" onClick={() => handleCreateCollege(searchQuery)} disabled={isCreatingCollege} className="w-full text-left px-4 py-3 text-sm font-bold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors flex items-center gap-2 sticky bottom-0">
                                {isCreatingCollege ? <div className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isCreatingCollege ? "Adding..." : `+ Add "${searchQuery}" as new college`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">

                        {/* BRANCH SELECTOR */}
                        <div className="relative">
                          <select
                            value={branch}
                            onChange={e => setBranch(e.target.value)}
                            className="w-full bg-surface-base border-none rounded-xl px-4 py-4 text-text-primary focus:ring-2 focus:ring-brand-primary/20 outline-none font-medium appearance-none"
                          >
                            <option value="" disabled>Branch</option>
                            {INDIAN_COLLEGE_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>

                        {/* YEAR SELECTOR */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>                          <input 
                            type="text" 
                            placeholder="Year (e.g. 2026)" 
                            value={yearSearchQuery} 
                            onChange={e => { setYearSearchQuery(e.target.value); setShowYearDropdown(true); }}
                            onFocus={() => setShowYearDropdown(true)}
                            className="w-full bg-surface-base border-none rounded-xl px-4 py-4 text-text-primary focus:ring-2 focus:ring-brand-primary/20 outline-none font-medium placeholder:text-text-secondary"
                          />
                          {showYearDropdown && yearSearchQuery.trim().length > 0 && (
                            <div className="absolute left-0 right-0 mt-2 max-h-40 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl z-50 no-scrollbar flex flex-col">
                              {yearList.filter(item => item.includes(yearSearchQuery)).map(item => (
                                <button key={item} type="button" onClick={() => { setYear(item); setYearSearchQuery(item); setShowYearDropdown(false); }} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-brand-primary/5 hover:text-brand-primary transition-colors border-b border-slate-50 last:border-none">
                                  {item}
                                </button>
                              ))}
                              {!yearList.some(item => item === yearSearchQuery.trim()) && (
                                <button type="button" onClick={() => { setYearList(prev => [...prev, yearSearchQuery]); setYear(yearSearchQuery); setYearSearchQuery(yearSearchQuery); setShowYearDropdown(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors flex items-center gap-2 sticky bottom-0">
                                  + Add "{yearSearchQuery}"
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 4. Categories Selector */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">What categories do you want to see?</label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar">
                    {categoriesList.map(opt => {
                      const isSelected = categories.includes(opt);
                      const isDisabled = !isSelected && categories.length >= 6;
                      return (
                        <button
                          key={opt} type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (isSelected) setCategories(categories.filter(i => i !== opt));
                            else if (categories.length < 6) setCategories([...categories, opt]);
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${isSelected ? "bg-text-primary text-white border-text-primary" : isDisabled ? "bg-white text-slate-300 border-slate-100 cursor-not-allowed" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave} 
                disabled={cities.length === 0 || !role || (role === "Student" && (!college || !year || !branch)) || categories.length === 0}                className="w-full bg-brand-primary disabled:bg-[#E5E5EA] disabled:text-text-secondary text-white py-4 rounded-full font-bold transition-all active:scale-95 mt-4"
              >
                Complete Profile
              </button>
            </motion.div>
          )}

          {/* LOADING STATE: The Magic Animation */}
          {isSaving && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-surface-base border-t-brand-primary rounded-full animate-spin" />
              <p className="font-heading font-bold text-lg text-text-primary animate-pulse">
                Gathering events to match your preferences...
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}