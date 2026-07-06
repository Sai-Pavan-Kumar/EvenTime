"use client";

import { useState, useEffect } from "react";
import { CITIES } from "@/lib/constants/cities";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, GraduationCap, Target, Save, CheckCircle2, Lock, X, AlertTriangle, Bug } from "lucide-react";
import { toast } from "sonner";
import { updateProfileSettings } from "./actions";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow, CollegeRow } from "@/types";
import { categoriesList } from "@/features/create-event/constants";
import { INDIAN_COLLEGE_BRANCHES } from "@/lib/constants/branches";
import { createCollegeAction } from "@/app/profile/action";

export default function SettingsClient({ 
  profile, 
  categoryCounts = {},
  userEmail
}: { 
  profile: Partial<ProfileRow> & { preferred_cities?: string[] | null }, 
  categoryCounts?: Record<string, number>,
  userEmail?: string
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  // Immutability flag: If profile is fully onboarded, lock identity/education fields.
  const isLocked = !!profile?.is_onboarded;

  // States for Context/Identity Logic (Converted uncontrolled inputs to controlled for reliable submission)
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [selectedCities, setSelectedCities] = useState<string[]>(profile?.preferred_cities || []);
  const [userType, setUserType] = useState(() => {
    if (!profile?.user_type) return "";
    const ut = profile.user_type;
    if (ut === "student") return "Student";
    return ut.charAt(0).toUpperCase() + ut.slice(1);
  });
  
  // States for Education Logic
  const [college, setCollege] = useState(profile?.college || "");
  const [year, setYear] = useState(profile?.graduation_year || "");
  const [branch, setBranch] = useState(profile?.branch || "");

  // College search dropdown states
  const [collegesList, setCollegesList] = useState<CollegeRow[]>([]);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState(profile?.college || "");
  const [collegeId, setCollegeId] = useState<string | null>(profile?.college_id || null);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
const [isCreatingCollege, setIsCreatingCollege] = useState(false);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  
  // Align admin check with OnboardingModal exactly (checks role, type)
   const isAdmin = profile?.user_type === 'admin' ||  profile?.role === 'admin';
 // UPDATED: Live server-side search (debounced) instead of loading all 54k colleges
  useEffect(() => {
    const query = collegeSearchQuery.trim();
    if (!query) {
      setCollegesList([]);
      return;
    }
    setIsSearchingColleges(true);
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("colleges")
        .select("id, name, state")
        .ilike("name", `%${query}%`)
        .order("name", { ascending: true })
        .limit(10);
      if (error) console.error("Colleges fetch error:", error);
      setCollegesList((data as CollegeRow[]) || []);
      setIsSearchingColleges(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [collegeSearchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-college-dropdown]")) setShowCollegeDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateCollege = async (name: string) => {
    setIsCreatingCollege(true);
    const result = await createCollegeAction(name);
    if (result.data && !result.error) {
      setCollegesList(prev => [...prev, result.data as CollegeRow]);
      setCollege(result.data.name);
      setCollegeId(result.data.id);
      setCollegeSearchQuery(result.data.name);
    } else {
      toast.error("Failed to add college. Please try again.");
    }
    setIsCreatingCollege(false);
    setShowCollegeDropdown(false);
  };

  const toggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      setSelectedCities(selectedCities.filter(c => c !== cityName));
    } else if (isAdmin || selectedCities.length < 3) {
      setSelectedCities([...selectedCities, cityName]);
    }
  };

  // State for Goals Selection
  const [selectedGoals, setSelectedGoals] = useState<string[]>(profile?.goals || []);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else if (isAdmin || selectedGoals.length < 6) {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Inject state variables directly into FormData.
    // This is strictly required because `disabled` inputs are normally omitted from form submissions.
    formData.set("fullName", fullName);
    formData.set("username", username);
    formData.set("user_type", userType.toLowerCase());
    formData.set("preferred_cities", JSON.stringify(selectedCities));
    
    if (userType === "Student" && college) formData.set("college", college);
    else if (userType === "Student" && collegeSearchQuery) formData.set("college", collegeSearchQuery);
    else formData.delete("college");

    if (userType === "Student" && collegeId) formData.set("collegeId", collegeId);
    else formData.delete("collegeId");
    
        formData.delete("yearOfStudying");

    
    if (userType === "Student" && year) formData.set("graduationYear", year);
    else formData.delete("graduationYear");

    if (userType === "Student" && branch) formData.set("branch", branch);
    else formData.delete("branch");
    
    formData.delete("goals");
    formData.append("goals", JSON.stringify(selectedGoals));

    const result = await updateProfileSettings(formData);
    
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Profile updated successfully!");
      router.push("/profile");
    }
  };

  // NEW: What's missing checklist, mirrors the calculateCompletion formula used across the app
  const isStudentNow = userType === "Student";
  const missingItems: string[] = [];
  if (!profile?.avatar_url) missingItems.push("Profile photo");
  if (!username) missingItems.push("Username");
  if (selectedCities.length === 0) missingItems.push("Preferred cities");
  if (selectedGoals.length === 0) missingItems.push("Interest categories");
  if (isStudentNow && (!college || !year || !branch)) missingItems.push("College, graduation year & branch");

  return (
    <main className="min-h-screen bg-[#F5F5F7] pb-32">
      {/* Mobile-Optimized Sticky Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-900" />
        </button>
        <div>
          <h1 className="font-heading font-black text-xl text-slate-900">Profile Settings</h1>
          <p className="text-xs text-slate-500 font-medium">Update your identity and goals</p>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-8">
        {missingItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-700">Still missing to reach 100%:</p>
              <p className="text-xs text-amber-600 font-medium mt-1">{missingItems.join(" · ")}</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Identify (Personal Info) */}
          <div className="bg-white rounded-3x1 border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Identity</h2>
              </div>
              {isLocked && <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>}
            </div>

            <div className="space-y-5">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">What's your name?</label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  disabled={isLocked}
                  placeholder="Your Name"
                  className="w-full bg-[#F8F9FB] border-none text-slate-900 px-4 py-3.5 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-brand/20 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                {isLocked && <Lock className="absolute right-4 top-9 w-4 h-4 text-slate-400" />}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Public Username</label>
                <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 font-bold z-10">@</span>
                  <input 
                    type="text" 
                    name="username" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    disabled={isLocked}
                    minLength={3}
                    maxLength={12}
                    pattern="[A-Za-z0-9]+"
                    title="Only letters and numbers are allowed. Minimum 3, maximum 12 characters."
                    placeholder="your_handle"
                    className="w-full bg-[#F8F9FB] border-none text-slate-900 pl-10 pr-10 py-3.5 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-brand/20 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  {isLocked && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />}
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-1">This will be your public storefront link. Max 12 chars (letters and numbers only).</p>
              </div>

              {/* Editable: City Multi-Select (max 3) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Event Cities <span className="text-slate-300 font-normal normal-case">{isAdmin ? "(pick as many as you want)" : "(pick up to 3)"}</span>
                </label>
                {selectedCities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedCities.map(c => (
                      <span key={c} className="inline-flex items-center gap-1.5 bg-[#1D1D1F] text-white text-xs font-bold px-3 py-1.5 rounded-full">
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
                    const isSelected = selectedCities.includes(loc);
                    const isDisabled = !isSelected && !isAdmin && selectedCities.length >= 3;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleCity(loc)}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                            : isDisabled
                            ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">What are you</label>
                <select 
                  value={userType} 
                  onChange={e => setUserType(e.target.value)} 
                  required
                  disabled={isLocked}
                  className="w-full bg-[#F8F9FB] border-none text-slate-900 px-4 py-3.5 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-brand/20 transition-all outline-none appearance-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="" disabled>Select your role</option>
                  {["Founder", "Investor", "Student", "Recent Graduate", "Professional", "Prefer not to say"].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {isLocked && <Lock className="absolute right-4 top-9 w-4 h-4 text-slate-400 pointer-events-none" />}
              </div>

            </div>
          </div>

          {/* Education Context */}
          <AnimatePresence>
            {userType === "Student" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-3x1 border border-slate-100 p-6 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h2 className="font-bold text-lg text-slate-900">Education Context</h2>
                  </div>
                  {isLocked && <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>}
                </div>

                <div className="space-y-5">
                  {/* College Search Dropdown */}
                  <div className="relative" data-college-dropdown>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">College Name</label>
                    {isLocked ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={college}
                          disabled
                          className="w-full bg-slate-100 border-none text-slate-900 px-4 py-3.5 rounded-xl text-[15px] font-medium outline-none opacity-60 cursor-not-allowed"
                        />
                        <Lock className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Type to search your college"
                          value={collegeSearchQuery}
                          onChange={e => { setCollegeSearchQuery(e.target.value); setCollege(""); setShowCollegeDropdown(true); }}
                          onFocus={() => setShowCollegeDropdown(true)}
                          className="w-full bg-[#F8F9FB] border-none text-slate-900 px-4 py-3.5 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-brand/20 transition-all outline-none"
                        />
                         {showCollegeDropdown && collegeSearchQuery.trim().length > 0 && (
                          <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl z-50 flex flex-col">
                            {isSearchingColleges && (
                              <div className="px-4 py-3 text-sm text-slate-400 font-medium">Searching...</div>
                            )}
                            {!isSearchingColleges && collegesList
                              .map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => { setCollege(item.name); setCollegeId(item.id); setCollegeSearchQuery(item.name); setShowCollegeDropdown(false); }}
                                  className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-slate-50 last:border-none flex items-center justify-between"
                                >
                                  <span>🏢 {item.name}</span>
                                  {item.state && <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0 ml-2">{item.state}</span>}
                                </button>
                              ))}
                            {!isSearchingColleges && !collegesList.some(item => item.name.toLowerCase() === collegeSearchQuery.toLowerCase().trim()) && (
                              <button
                                type="button"
                                onClick={() => handleCreateCollege(collegeSearchQuery)}
                                disabled={isCreatingCollege}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-2 sticky bottom-0"
                              >
                                  {isCreatingCollege && <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />}
                                {isCreatingCollege ? "Adding..." : `+ Add "${collegeSearchQuery}" as new college`}
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Can't find your college? It will be added automatically.</p>
                      </>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Branch</label>
                      <select
                        value={branch}
                        onChange={e => setBranch(e.target.value)}
                        required={userType === "Student"}
                        disabled={isLocked}
                        className="w-full bg-[#F8F9FB] border-none text-slate-900 px-4 py-3.5 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-brand/20 transition-all outline-none appearance-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <option value="" disabled>Select</option>
                        {INDIAN_COLLEGE_BRANCHES.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      {isLocked && <Lock className="absolute right-4 top-9 w-4 h-4 text-slate-400 pointer-events-none" />}
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Yr of Graduation</label>
                      <select 
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        required={userType === "Student"}
                        disabled={isLocked}
                        className="w-full bg-[#F8F9FB] border-none text-slate-900 px-4 py-3.5 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-brand/20 transition-all outline-none appearance-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <option value="" disabled>Select</option>
                        {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      {isLocked && <Lock className="absolute right-4 top-9 w-4 h-4 text-slate-400 pointer-events-none" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editable: Event Categories */}
          <div className="bg-white rounded-3x1 border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-amber-500" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Event Categories</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                {selectedGoals.length}{!isAdmin && "/6"}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-6 ml-11">
              {isAdmin ? "Select as many categories as you want (Admin)." : "Select up to 6 categories you are interested in."}
            </p>

            <div className="flex flex-wrap gap-2.5">
              {categoriesList.map((goal) => {
                const isSelected = selectedGoals.includes(goal);
                const count = categoryCounts[goal] || 0;
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 border ${
                      isSelected 
                        ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-md shadow-black/10" 
                        : !isAdmin && selectedGoals.length >= 6
                        ? "bg-white text-slate-300 border-transparent cursor-not-allowed"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {goal}
                    {count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ml-1 font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-[#5835E5]/10 text-[#5835E5]'}`}>
                        {count}
                      </span>
                    )}
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danger Zone (DPDP Compliance) */}
          <div className="bg-red-50 rounded-3xl border border-red-100 p-6 shadow-sm mt-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
                            <h2 className="font-bold text-lg text-red-900">Danger Zone</h2>
            </div>
            <p className="text-sm text-red-800/70 font-medium mb-6 ml-11">
              Permanently delete your account and all associated data. This action is irreversible and complies with your Right to Erasure under the DPDP Act.
            </p>
            <div className="ml-11">
              <button 
                type="button"
                onClick={async () => {
                  if (window.confirm("WARNING: Once you delete your account, it cannot be recovered. It is gone forever. Are you absolutely sure you want to proceed?")) {
                    const supabase = createClient();
                    
                    // Call the secure RPC function to delete the user
                    const { error } = await supabase.rpc('delete_user' as any);
                    
                    if (error) {
                      toast.error("Failed to delete account. Please try again.");
                      console.error("Delete user error:", error);
                      return;
                    }

                    // Sign out and redirect
                    await supabase.auth.signOut();
                    toast.success("Your account has been permanently deleted.");
                    router.push("/login");
                  }
                }}
                className="px-6 py-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Delete My Account
              </button>
            </div>
          </div>
          {/* Fixed Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-40 md:relative md:bg-transparent md:border-none md:p-0 md:backdrop-blur-none">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#6C47FF] text-white hover:bg-white hover:text-[#6C47FF] border-2 border-transparent hover:border-[#6C47FF] px-6 py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-lg shadow-[#6C47FF]/25"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Profile
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </main>
    );
  }