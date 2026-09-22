"use client";

import { motion } from "framer-motion";
import { Link2, AlertTriangle, MapPin, Video, CheckCircle2, IndianRupee, Loader2 } from "lucide-react";
import { MiniCalendar, DrumColumn, ConfidenceField } from "./SharedUI";
import { categoriesList, hours, mins, ampms, COLLEGE_YEAR_OPTIONS } from "../constants";
import { CITIES } from "@/lib/constants/cities";
import { INDIAN_COLLEGE_BRANCHES } from "@/lib/constants/branches";
import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CollegeRow } from "@/types";
import { useCollegeSearch } from "@/features/create-event/hooks/useCollegeSearch";
import { useDuplicateCheck } from "@/features/create-event/hooks/useDuplicateCheck";
import { isVerifiedDomain } from "@/lib/constants/verifiedDomains";
import { toast } from "sonner";



export function StepMandatory({
  data,
  updateData,
  isCollegeCategory,
  onNext,
  isValid,
  isSubmitting,
  onSubmit,
  isEditing,
  isAdminFeatureEnabled,
  isCurrentUserAdmin,
  profileCollege,
  initialEventId,
  duplicateError,
  setDuplicateError,
  isCheckingDuplicate,
  setIsCheckingDuplicate,
}: any) {
  
  // SECURE ADMIN CHECK
  const isAdmin = isCurrentUserAdmin;
  const { checkDuplicateLink } = useDuplicateCheck();

  // Instant domain trust computation (0ms, no flash of unverified badge)
  const isLinkVerified = !data.regLink || isVerifiedDomain(data.regLink);

  // NEW: College picker for restricted college events (live server search)
  const [collegeSearchQuery, setCollegeSearchQuery] = useState(data.collegeName || "");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [isCreatingCollege, setIsCreatingCollege] = useState(false);
  const { collegesList, setCollegesList, isSearchingColleges } = useCollegeSearch(collegeSearchQuery);

  // Keep college search input in sync with data.collegeName
  useEffect(() => {
    if (data.collegeName && data.collegeName !== collegeSearchQuery) {
      setCollegeSearchQuery(data.collegeName);
    }
  }, [data.collegeName, collegeSearchQuery]);

  // Searchable branch state
  const [branchSearchQuery, setBranchSearchQuery] = useState(data.collegeBranch || "");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  useEffect(() => {
    if (data.collegeBranch && data.collegeBranch !== branchSearchQuery && !showBranchDropdown) {
      setBranchSearchQuery(data.collegeBranch);
    } else if (!data.collegeBranch && !showBranchDropdown) {
      setBranchSearchQuery("");
    }
  }, [data.collegeBranch, showBranchDropdown]);

  const filteredBranches = useMemo(() => {
    const q = branchSearchQuery.trim().toLowerCase();
    if (!q || q === (data.collegeBranch || "").toLowerCase().trim()) {
      return INDIAN_COLLEGE_BRANCHES;
    }
    return INDIAN_COLLEGE_BRANCHES.filter(b => b.toLowerCase().includes(q));
  }, [branchSearchQuery, data.collegeBranch]);

  const handleCreateCollege = async (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      toast.error("Please enter the full official college name (at least 3 characters).");
      return;
    }
    setIsCreatingCollege(true);
    const { createCollegeAction } = await import("@/app/profile/action");
    const result = await createCollegeAction(trimmed);
    setIsCreatingCollege(false);
    if (result?.data) {
      updateData({ collegeId: result.data.id, collegeName: result.data.name });
      setCollegeSearchQuery(result.data.name);
      setShowCollegeDropdown(false);
      setCollegesList(prev => [...prev, result.data as CollegeRow]);
      toast.success(`Added "${result.data.name}" to directory!`);
    } else if (result?.error) {
      toast.error(result.error || "Failed to add college.");
    }
  };

  // AUTO-VALIDATE COLLEGE EVENTS
  useEffect(() => {
    if (isCollegeCategory && data.selectedAudience.length === 0) {
      updateData({ selectedAudience: ["College Students"] });
    }
  }, [isCollegeCategory, data.selectedAudience.length, updateData]);

  const lastCheckedUrlRef = useRef<string>("");

  // Debounced duplicate registration link check
  useEffect(() => {
    const trimmed = (data.regLink || "").trim();
    if (!trimmed || trimmed.length < 5) {
      lastCheckedUrlRef.current = "";
      setDuplicateError?.("");
      setIsCheckingDuplicate?.(false);
      return;
    }

    // If this exact URL has already been checked, don't keep checking
    if (trimmed === lastCheckedUrlRef.current) {
      setIsCheckingDuplicate?.(false);
      return;
    }

    const controller = new AbortController();
    setIsCheckingDuplicate?.(true);

    const timer = setTimeout(async () => {
      try {
        const existing = await checkDuplicateLink(trimmed, initialEventId, controller.signal);
        if (controller.signal.aborted) return;
        lastCheckedUrlRef.current = trimmed;
        if (existing) {
          setDuplicateError?.(`This event was already posted as "${existing.title}".`);
        } else {
          setDuplicateError?.("");
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("[StepMandatory] checkDuplicateLink error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingDuplicate?.(false);
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [data.regLink, initialEventId, checkDuplicateLink, setDuplicateError, setIsCheckingDuplicate]);

  // Link Domain Verification Handler
  const handleLinkInput = (url: string) => {
    const trusted = isVerifiedDomain(url);
    updateData({ regLink: url, isTrustedDomain: trusted });
    if (url.trim() !== lastCheckedUrlRef.current) {
      setDuplicateError?.("");
    }
  };

  return (
    <motion.div key="stepMandatory" initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} className="space-y-8">
      
      {/* LINK INPUT */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            Registration Link {data.isOnline ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal text-xs ml-1">(Optional)</span>}
          </label>
          {data.regLink && !duplicateError && isLinkVerified && (
            <span title="Verified platform domain. Approved automatically." className="text-emerald-600 flex items-center gap-1 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Domain
            </span>
          )}
          {data.regLink && !duplicateError && !isLinkVerified && (
            <span title="Unverified link domain. Will require admin approval." className="text-amber-500 flex items-center gap-1 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" /> Unverified Domain
            </span>
          )}
          {duplicateError && (
            <span className="text-red-500 flex items-center gap-1 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" /> Duplicate Link
            </span>
          )}
        </div>
        <div className="relative">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            id="event-reg-link-input"
            type="url"
            value={data.regLink}
            maxLength={500}
            onChange={e => handleLinkInput(e.target.value)}
            placeholder="Paste event link (lu.ma, eventbrite, unstop, etc.)"
            className={`w-full bg-white border rounded-xl px-4 py-3.5 pl-11 pr-12 focus:ring-4 outline-none transition-all ${
              duplicateError
                ? "border-red-400 focus:ring-red-500/10 focus:border-red-500 text-red-950"
                : "border-slate-200 focus:ring-[#6C47FF]/10 focus:border-[#6C47FF]"
            }`}
          />
          {duplicateError ? (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : isCheckingDuplicate ? (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#6C47FF]" />
            </div>
          ) : (
            <>
              {data.regLink && isLinkVerified && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              {data.regLink && !isLinkVerified && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
            </>
          )}
        </div>

        {/* DUPLICATE WARNING */}
        {duplicateError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-start gap-2.5 mt-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-700 leading-snug">
                Duplicate Event Detected
              </p>
              <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                {duplicateError}
              </p>
            </div>
          </motion.div>
        )}

        {/* TRUST WARNING IF UNVERIFIED (ONLY IF NOT DUPLICATE) */}
        {!duplicateError && !isLinkVerified && data.regLink && !isAdmin && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2 mt-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-amber-700 leading-relaxed">
              This link is from an unverified platform. The event will go live once reviewed by an admin.
            </p>
          </motion.div>
        )}
      </div>

      {/* BASICS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            Event Title <span className="text-red-500">*</span>
          </label>
          <span className={`text-xs font-mono ${(data.title || "").length >= 100 ? "text-red-500 font-bold" : "text-slate-400"}`}>
            {(data.title || "").length}/100
          </span>
        </div>
        <input
          id="event-title-input"
          type="text"
          value={data.title}
          maxLength={100}
          onChange={e => updateData({ title: e.target.value })}
          className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:border-[#6C47FF]"
        />
      </div>

      {/* CATEGORY */}
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">Category <span className="text-red-500">*</span></label>
          <select id="event-category-select" value={data.category} onChange={e => updateData({ category: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl p-3.5 outline-none">
            <option value="" disabled>Select category</option>
            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* COLLEGE / CAMPUS EVENT TOGGLE */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div>
          <p className="text-sm font-bold text-slate-800">College / Campus Event?</p>
          <p className="text-xs text-slate-500">Enable if this event is hosted by or associated with a college</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !data.isCollegeEvent;
            updateData({
              isCollegeEvent: next,
              ...(!next ? {
                collegeId: null,
                collegeName: "",
                collegeBranch: "",
                collegeYear: "",
                collegeOnly: false,
              } : {})
            });
            if (!next) {
              setCollegeSearchQuery("");
            }
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            data.isCollegeEvent ? "bg-[#6C47FF]" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              data.isCollegeEvent ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* COLLEGE FIELDS (DYNAMIC) */}
      {isCollegeCategory && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "visible" } }} 
              className="overflow-visible"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                <p className="text-sm font-bold text-brand-primary">College Event Details</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Open to all colleges?</p>
                    <p className="text-xs text-slate-500">Toggle off to restrict to one college only</p>
                  </div>
                  <button
                    type="button" onClick={() => updateData({ collegeOnly: !data.collegeOnly })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!data.collegeOnly ? "bg-blue-500" : "bg-slate-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!data.collegeOnly ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                  <div className="space-y-2 relative z-30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-500">College / Institute Name <span className="text-red-500">*</span></label>
                      {Boolean(profileCollege?.name && data.collegeName && data.collegeName.trim().toLowerCase() === profileCollege.name.trim().toLowerCase()) && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                          Prefilled from Profile
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={collegeSearchQuery}
                        onChange={e => { setCollegeSearchQuery(e.target.value); setShowCollegeDropdown(true); updateData({ collegeId: null, collegeName: "" }); }}
                        onFocus={() => setShowCollegeDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCollegeDropdown(false), 250)}
                        placeholder="Search college (e.g. CBIT, IIT, BITS...)" maxLength={100}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 pr-10 outline-none text-sm focus:border-[#6C47FF]"
                      />
                      {isSearchingColleges && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="w-4 h-4 border-2 border-[#6C47FF]/30 border-t-[#6C47FF] rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                     {showCollegeDropdown && collegeSearchQuery.trim().length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col no-scrollbar" onMouseDown={(e) => e.preventDefault()}>
                        {collegeSearchQuery.trim().length === 1 && (
                          <div className="px-4 py-3 text-xs text-slate-400 font-medium">
                            Type at least 2 characters to search...
                          </div>
                        )}
                        {isSearchingColleges && collegesList.length === 0 && collegeSearchQuery.trim().length >= 2 && (
                          <div className="px-4 py-3 text-sm text-slate-400 font-medium flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-[#6C47FF]/30 border-t-[#6C47FF] rounded-full animate-spin" />
                            Searching colleges...
                          </div>
                        )}
                        {collegesList.map(item => (
                          <button 
                            key={item.id} 
                            type="button" 
                            onMouseDown={(e) => { 
                              e.preventDefault(); // Stop blur from happening early
                              updateData({ collegeId: item.id, collegeName: item.name }); 
                              setCollegeSearchQuery(item.name); 
                              setShowCollegeDropdown(false); 
                            }} 
                            className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-brand-primary/5 hover:text-brand-primary transition-colors border-b border-slate-50 last:border-none"
                          >
                            🏢 {item.name} {item.state ? <span className="text-[10px] text-slate-400 font-bold uppercase float-right">{item.state}</span> : null}
                          </button>
                        ))}
                        {!isSearchingColleges && collegeSearchQuery.trim().length >= 2 && collegesList.length === 0 && (
                          <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-col gap-2">
                            <p className="text-xs text-slate-500 font-medium">
                              No matching college found in our directory.
                            </p>
                            <button 
                              type="button" 
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCreateCollege(collegeSearchQuery);
                              }} 
                              disabled={isCreatingCollege} 
                              className="w-full px-3 py-2 text-sm font-bold text-brand-primary bg-white hover:bg-brand-primary/10 border border-[#6C47FF]/20 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                              {isCreatingCollege && <div className="w-4 h-4 border-2 border-[#6C47FF]/30 border-t-[#6C47FF] rounded-full animate-spin" />}
                              {isCreatingCollege ? "Adding..." : `+ Add "${collegeSearchQuery.trim()}" as new college`}
                            </button>
                            <p className="text-[10px] text-slate-400 leading-tight">
                              💡 Please enter the full official college name (e.g. CVR College of Engineering) so other students can easily find it.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-20">
                  <div className="space-y-2 relative">
                    <label className="block text-xs font-bold text-slate-500">Branch</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={branchSearchQuery}
                        onChange={e => {
                          const val = e.target.value;
                          setBranchSearchQuery(val);
                          setShowBranchDropdown(true);
                          const exact = INDIAN_COLLEGE_BRANCHES.find(b => b.toLowerCase() === val.trim().toLowerCase());
                          if (exact) {
                            updateData({ collegeBranch: exact });
                          } else if (!val.trim()) {
                            updateData({ collegeBranch: "" });
                          }
                        }}
                        onFocus={() => setShowBranchDropdown(true)}
                        onBlur={() => setTimeout(() => setShowBranchDropdown(false), 250)}
                        placeholder="Search branch (e.g. CSE, ECE)..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-[#6C47FF] pr-8"
                      />
                      {data.collegeBranch ? (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            updateData({ collegeBranch: "" });
                            setBranchSearchQuery("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          title="Clear branch"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs pointer-events-none">▼</span>
                      )}
                    </div>
                    {showBranchDropdown && (
                      <div
                        className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col no-scrollbar"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            updateData({ collegeBranch: "" });
                            setBranchSearchQuery("");
                            setShowBranchDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors border-b border-slate-50 ${
                            !data.collegeBranch ? "bg-brand-primary/10 text-brand-primary font-bold" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          All Branches
                        </button>
                        {filteredBranches.map(b => {
                          const isSelected = data.collegeBranch === b;
                          return (
                            <button
                              key={b}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                updateData({ collegeBranch: b });
                                setBranchSearchQuery(b);
                                setShowBranchDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-slate-50 last:border-none flex items-center justify-between ${
                                isSelected ? "bg-brand-primary/10 text-brand-primary font-bold" : "text-slate-700 hover:bg-slate-50 font-medium"
                              }`}
                            >
                              <span>{b}</span>
                              {isSelected && <span className="text-brand-primary font-bold ml-2">✓</span>}
                            </button>
                          );
                        })}
                        {filteredBranches.length === 0 && (
                          <div className="px-4 py-3 text-xs text-slate-400 font-medium">No branch matching "{branchSearchQuery}"</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500">Graduation Year</label>
                    <select
                      value={data.collegeYear || "All Years"}
                      onChange={e => updateData({ collegeYear: e.target.value === "All Years" ? "" : e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-[#6C47FF]"
                    >
                      {COLLEGE_YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* DESCRIPTION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">Description <span className="text-red-500">*</span></label>
              <span className={`text-xs font-mono ${(data.description || "").length >= 3000 ? "text-red-500 font-bold" : "text-slate-400"}`}>
                {(data.description || "").length}/3000
              </span>
            </div>
            <textarea
              id="event-description-input"
              value={data.description}
              maxLength={3000}
              onChange={e => updateData({ description: e.target.value })}
              placeholder="What is this event about?"
              className="w-full bg-white border border-slate-200 rounded-xl p-4 min-h-[120px] outline-none focus:border-[#6C47FF] focus:ring-4 focus:ring-[#6C47FF]/10"
            />
          </div>

          {/* DATE & TIME & LOCATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
        <div id="event-date-section" className="space-y-4">
           <div className="flex items-center justify-between mb-2">
             <label className="text-sm font-semibold text-slate-700">Event Date <span className="text-red-500">*</span></label>
             <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 cursor-pointer hover:text-brand-primary transition-colors">
               <input type="checkbox" checked={data.hasEndDate} onChange={() => updateData({ hasEndDate: !data.hasEndDate })} className="w-3.5 h-3.5 rounded text-brand-primary outline-none" />
               + End Date
             </label>
           </div>
           <MiniCalendar selectedDate={data.selectedDate} onSelect={(d) => updateData({ selectedDate: d })} />
           
           {data.hasEndDate && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 border-l-2 border-[#6C47FF] pl-3 overflow-hidden">
               <MiniCalendar selectedDate={data.endDate} onSelect={(d) => updateData({ endDate: d })} />
             </motion.div>
           )}

           <div className="pt-4">
             <div className="flex items-center justify-between mb-2">
               <label className="block text-xs font-semibold text-slate-500">Start Time</label>
               <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 cursor-pointer hover:text-brand-primary transition-colors">
                 <input type="checkbox" checked={data.hasEndTime} onChange={() => updateData({ hasEndTime: !data.hasEndTime })} className="w-3.5 h-3.5 rounded text-brand-primary outline-none" />
                 + End Time
               </label>
             </div>
             <div className="flex gap-2">
               <select value={data.selectedHour} onChange={e => updateData({ selectedHour: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-[#6C47FF]"><option value="">HH</option>{hours.map(h => <option key={`sh-${h}`} value={h}>{h}</option>)}</select>
              <select value={data.selectedMin} onChange={e => updateData({ selectedMin: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-[#6C47FF]"><option value="">MM</option>{mins.map(m => <option key={`sm-${m}`} value={m}>{m}</option>)}</select>
              <select value={data.selectedAmPm} onChange={e => updateData({ selectedAmPm: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-[#6C47FF]">{ampms.map(a => <option key={`sa-${a}`} value={a}>{a}</option>)}</select>
             </div>

             {data.hasEndTime && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 border-l-2 border-[#6C47FF] pl-3 overflow-hidden">
                 <div className="flex gap-2">
                   <select value={data.endHour} onChange={e => updateData({ endHour: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-[#6C47FF]"><option value="" disabled>HH</option>{hours.map(h => <option key={`eh-${h}`} value={h}>{h}</option>)}</select>
                   <select value={data.endMin} onChange={e => updateData({ endMin: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-[#6C47FF]"><option value="" disabled>MM</option>{mins.map(m => <option key={`em-${m}`} value={m}>{m}</option>)}</select>
                   <select value={data.endAmPm} onChange={e => updateData({ endAmPm: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-[#6C47FF]">{ampms.map(a => <option key={`ea-${a}`} value={a}>{a}</option>)}</select>
                 </div>
               </motion.div>
             )}
           </div>
        </div>
        
        <div className="space-y-4">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
             <label className="text-sm font-semibold text-slate-700">Event Location <span className="text-red-500">*</span></label>
             <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
               <button
                 type="button"
                 onClick={() => updateData({ isOnline: false })}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                   !data.isOnline ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                 }`}
               >
                 <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                 In-Person
               </button>
               <button
                 type="button"
                 onClick={() => updateData({ isOnline: true })}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                   data.isOnline ? "bg-[#1D1D1F] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                 }`}
               >
                 <Video className="w-3.5 h-3.5" />
                 Virtual / Online
               </button>
             </div>
           </div>

           {!data.isOnline ? (
              <div className="space-y-3">
                <select
                  id="event-city-select"
                  value={data.city || ""}
                  onChange={e => updateData({ city: e.target.value, location: data.location && data.location !== data.city ? data.location : e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand-primary/20 outline-none"
                >
                  <option value="" disabled>Select City</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-600">Venue Address (Optional)</label>
                    <span className={`text-xs font-mono ${(data.location && data.location !== data.city ? data.location : "").length >= 150 ? "text-red-500 font-bold" : "text-slate-400"}`}>
                      {(data.location && data.location !== data.city ? data.location : "").length}/150
                    </span>
                  </div>
                  <input
                    type="text"
                    value={data.location && data.location !== data.city ? data.location : ""}
                    onChange={e => updateData({ location: e.target.value.trim() ? e.target.value : data.city })}
                    placeholder="Venue Address / Campus Landmark (Optional)"
                    maxLength={150}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand-primary/20 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            ) : (
             <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold"><Video className="w-4 h-4 text-brand-primary" /> Virtual Event</div>
           )}
           {/* FREE / PAID */}
           <div className="pt-6">
             <label className="block text-sm font-semibold text-slate-700 mb-3">Pricing</label>
             <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => updateData({ isFree: true, price: "" })} className={`py-3 px-4 rounded-xl border-2 flex items-center gap-2 ${data.isFree ? "border-[#6C47FF] bg-white" : "border-transparent bg-slate-100"}`}>
                  <span className="text-sm font-bold">Free Event</span>
                </button>
                <button type="button" onClick={() => updateData({ isFree: false })} className={`py-3 px-4 rounded-xl border-2 flex items-center gap-2 ${!data.isFree ? "border-[#1D1D1F] bg-white" : "border-transparent bg-slate-100"}`}>
                  <span className="text-sm font-bold">Paid Event</span>
                </button>
             </div>
             {!data.isFree && (
               <div className="relative mt-3">
                 <IndianRupee className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                 <input
                   type="number"
                   min={0}
                   value={data.price}
                   maxLength={7}
                   max={9999999}
                   onChange={e => {
                     const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 7);
                     updateData({ price: val });
                   }}
                   placeholder="Ticket Price"
                   className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none"
                 />
               </div>
             )}

             {isAdmin && isAdminFeatureEnabled && (
               <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                 <label className="flex items-center gap-3 cursor-pointer">
                   <input type="checkbox" checked={data.isFeatured} onChange={e => updateData({ isFeatured: e.target.checked })} className="w-5 h-5 rounded border-amber-300 text-amber-500 focus:ring-amber-500 outline-none" />
                   <div>
                     <span className="block text-sm font-bold text-amber-900">Feature this event</span>
                     <span className="block text-xs text-amber-700 mt-0.5">Add a poster and advanced details</span>
                   </div>
                 </label>
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="pt-10 border-t border-slate-200 flex flex-col items-center justify-center space-y-5">
            {!isAdmin && !isLinkVerified && data.regLink && (
              <div className="text-xs text-amber-600 font-medium text-center bg-amber-50 px-4 py-2.5 rounded-xl max-w-md border border-amber-100">
                ⚠️ Since this link is from an unverified domain, your event will require admin approval before going live.
              </div>
            )}
            
           {/* isAdminFeatureEnabled OFF will block the next step */}
           {isAdmin && isAdminFeatureEnabled && data.isFeatured ? (
              <button 
                type="button" 
                onClick={onNext} 
                disabled={isSubmitting || isCheckingDuplicate || Boolean(duplicateError)} 
                className="bg-[#1D1D1F] hover:bg-black disabled:bg-slate-300 text-white px-12 py-4 rounded-full text-sm font-bold transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                 Continue to Next Step
              </button>
            ) : (
              <button 
                type="button" 
                onClick={onSubmit} 
                disabled={isSubmitting || isCheckingDuplicate || Boolean(duplicateError)} 
                className="bg-brand-primary hover:bg-[#5835e5] disabled:bg-slate-300 text-white px-12 py-4 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-[#6C47FF]/20 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isEditing ? "Updating Event..." : (isLinkVerified ? "Posting Event..." : "Submitting Event...")}</span>
                  </>
                ) : (
                  <>
                    <span>{isEditing ? "Update Event" : (isLinkVerified ? "Post your event" : "Submit Event")}</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
  );
}