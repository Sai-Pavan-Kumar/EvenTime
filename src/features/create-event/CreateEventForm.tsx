"use client";

import { useState, useEffect, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { FieldStatus, CreateEventFormProps } from "./types";
import { CATEGORY_TEMPLATES, categoriesList, teamOptions, hours, mins, ampms } from "./constants";
function toLocalDateString(d: Date) { 
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Hooks
import { useEventExtraction } from "./hooks/useEventExtraction";
import { useImageCrop } from "./hooks/useImageCrop";
import { useEventSubmit } from "./hooks/useEventSubmit";

// New 2-Step Components
import { StepMandatory } from "./components/StepMandatory";
import { StepFeatured } from "./components/StepFeatured";
import { CuratorCelebrationModal, CelebrationEventData } from "./components/CuratorCelebrationModal";
import { toast } from "sonner";

interface ExtendedFormProps extends CreateEventFormProps {
  isAdminFeatureEnabled?: boolean; // Controls if the Featured section is visible
  isCurrentUserAdmin?: boolean; // FIX: Controls the admin warnings
}

export function CreateEventForm({ initialData, isEditing = false, isAdminFeatureEnabled = false, isCurrentUserAdmin = false }: ExtendedFormProps) {
  const [step, setStep] = useState(0); // 0 = Mandatory, 1 = Featured/Advanced
  const [celebrationEvent, setCelebrationEvent] = useState<CelebrationEventData | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const DRAFT_STORAGE_KEY = "@eventime_create_event_draft_v1";
  const supabase = createClient();

  // Unified State Object
  const [eventData, setEventData] = useState({
    regLink: initialData?.registration_link || "",
    isTrustedDomain: initialData?.status ? initialData.status === "approved" : true,
    title: initialData?.title || "",
    category: initialData?.category || "",
    isCreatingNewCategory: false,
    selectedAudience: initialData?.target_audience || [],
    description: initialData?.description || "",
    location: initialData?.location || "",
    city: initialData?.city || "",
    selectedDate: (initialData?.date_string ? new Date(initialData.date_string) : undefined) as Date | undefined,
    fieldStatus: { title: "idle", description: "idle", location: "idle" } as Record<string, FieldStatus>,
    collegeBranch: initialData?.college_branch || "",
    collegeYear: initialData?.college_year || "",
    collegeOnly: initialData?.college_only || false,
    collegeId: initialData?.college_id || null,
    collegeName: initialData?.colleges?.name || "",
    selectedHour: initialData?.start_time ? initialData.start_time.split(":")[0] : "",
    selectedMin: initialData?.start_time ? initialData.start_time.split(":")[1].substring(0, 2) : "",
    selectedAmPm: initialData?.start_time ? initialData.start_time.slice(-2) : "AM",
    hasEndTime: !!initialData?.end_time,
    hasEndDate: !!initialData?.end_date_string,
    endDate: (initialData?.end_date_string ? new Date(initialData.end_date_string) : undefined) as Date | undefined,
    endHour: initialData?.end_time ? initialData.end_time.split(":")[0] : "08",
    endMin: initialData?.end_time ? initialData.end_time.split(":")[1].substring(0, 2) : "00",
    endAmPm: initialData?.end_time ? initialData.end_time.slice(-2) : "PM",
    isOnline: initialData?.is_virtual || false,
    isFree: initialData?.is_free ?? true,
    price: initialData?.price?.toString() || "",
    // Step 2 Adv/Featured
    isFeatured: initialData?.is_featured || false,
    organizer: initialData?.organizer_name || "",
    prizes: initialData?.prizes || "",
    teamSize: initialData?.team_size || "",
    registrationDeadline: (initialData?.registration_deadline ? new Date(initialData.registration_deadline) : undefined) as Date | undefined,
    website: initialData?.website || ""
  });

  const updateData = (updates: Partial<typeof eventData>) => {
    setEventData((prev) => ({ ...prev, ...updates }));
  };

  const isCollegeCategory = eventData.category === "College Event" || eventData.category === "College Fest";

  
  // Auto-restore draft from localStorage
  useEffect(() => {
    if (isEditing || initialData?.title) return;
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && (draft.title || draft.regLink || draft.description || draft.category)) {
          setEventData((prev) => ({
            ...prev,
            ...draft,
            selectedDate: draft.selectedDate ? new Date(draft.selectedDate) : undefined,
            endDate: draft.endDate ? new Date(draft.endDate) : undefined,
            registrationDeadline: draft.registrationDeadline ? new Date(draft.registrationDeadline) : undefined,
          }));
          setHasRestoredDraft(true);
        }
      }
    } catch (e) {
      console.warn("[CreateEvent] Failed to parse draft:", e);
    }
  }, [isEditing, initialData]);

  // Auto-save draft to localStorage (debounced)
  useEffect(() => {
    if (isEditing) return;
    const hasContent = eventData.title || eventData.regLink || eventData.description || eventData.category;
    if (!hasContent) return;

    const timer = setTimeout(() => {
      try {
        const toSave = {
          ...eventData,
          selectedDate: eventData.selectedDate ? eventData.selectedDate.toISOString() : undefined,
          endDate: eventData.endDate ? eventData.endDate.toISOString() : undefined,
          registrationDeadline: eventData.registrationDeadline ? eventData.registrationDeadline.toISOString() : undefined,
          fieldStatus: undefined,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        console.warn("[CreateEvent] Failed to save draft:", e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [eventData, isEditing]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasRestoredDraft(false);
      setEventData({
        regLink: "",
        isTrustedDomain: true,
        title: "",
        category: "",
        isCreatingNewCategory: false,
        selectedAudience: [],
        description: "",
        location: "",
        city: "",
        selectedDate: undefined,
        fieldStatus: { title: "idle", description: "idle", location: "idle" },
        collegeBranch: "",
        collegeYear: "",
        collegeOnly: false,
        collegeId: null,
        collegeName: "",
        selectedHour: "",
        selectedMin: "",
        selectedAmPm: "AM",
        hasEndTime: false,
        hasEndDate: false,
        endDate: undefined,
        endHour: "08",
        endMin: "00",
        endAmPm: "PM",
        isOnline: false,
        isFree: true,
        price: "",
        isFeatured: false,
        organizer: "",
        prizes: "",
        teamSize: "",
        registrationDeadline: undefined,
        website: "",
      });
      toast.success("Draft cleared");
    } catch (e) {
      console.error(e);
    }
  };

  const [profileCollege, setProfileCollege] = useState<{ id: string; name: string } | null>(null);

  // Auto-prefill student's registered college if creating a college event or fest
  useEffect(() => {
    const fetchUserProfileCollege = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("college_id, colleges(name)")
        .eq("id", user.id)
        .single();
      if (data && data.college_id && (data.colleges as any)?.name) {
        setProfileCollege({
          id: data.college_id,
          name: (data.colleges as any).name,
        });
      }
    };
    fetchUserProfileCollege();
  }, []);

  useEffect(() => {
    if (!initialData && isCollegeCategory && profileCollege && !eventData.collegeName) {
      updateData({
        collegeName: profileCollege.name,
        collegeId: profileCollege.id,
      });
    }
  }, [isCollegeCategory, profileCollege, eventData.collegeName, initialData]);

  const extraction = useEventExtraction({ 
    setTitle: (v) => updateData({ title: v }), 
    setDescription: (v) => updateData({ description: v }), 
    setLocation: (v) => updateData({ location: v }), 
    setSelectedDate: (v) => updateData({ selectedDate: v }), 
    setFieldStatus: (v) => updateData({ fieldStatus: typeof v === 'function' ? v(eventData.fieldStatus) : v }), 
    initialLink: initialData?.registration_link ?? undefined,
    currentEventId: initialData?.id,
    initialIsTrusted: eventData.isTrustedDomain,
    isAdmin: isCurrentUserAdmin 
  });
  
  const crop = useImageCrop(initialData?.poster_url ?? undefined);
  const { isSubmitting, submitEvent } = useEventSubmit();

   // Re-run domain trust check ONLY if it's a new event and they pasted a link.
  const handleSubmit = async () => {
    if (isCollegeCategory && eventData.collegeOnly && !eventData.collegeId) {
      alert("Please select your college before restricting this event to it — or turn off 'College Only' if you want it open to everyone.");
      return;
    }
    const res = await submitEvent({
      title: eventData.title,
      category: eventData.category,
      organizer_name: eventData.organizer,
      description: eventData.description,
      target_audience: isCollegeCategory ? eventData.selectedAudience : ["Everyone"],
      start_time: (eventData.selectedHour && eventData.selectedMin) ? `${eventData.selectedHour}:${eventData.selectedMin} ${eventData.selectedAmPm}` : null,
      end_time: eventData.hasEndTime ? `${eventData.endHour}:${eventData.endMin} ${eventData.endAmPm}` : null,
      end_date_string: eventData.hasEndTime && eventData.endDate ? toLocalDateString(eventData.endDate) : null,
      date_string: eventData.selectedDate ? toLocalDateString(eventData.selectedDate) : "",
      location: eventData.isOnline ? "Virtual Event" : eventData.location,
      city: eventData.isOnline ? "online" : eventData.city,
      is_virtual: eventData.isOnline,
      is_free: eventData.isFree,
      price: eventData.isFree ? 0 : Number(eventData.price),
      registration_link: eventData.regLink,
      prizes: eventData.isFeatured ? (eventData.prizes?.trim() || null) : null,
      team_size: eventData.isFeatured ? (eventData.teamSize?.trim() || null) : null,
      website: eventData.isFeatured ? (eventData.website?.trim() || null) : null,
      is_featured: eventData.isFeatured,
      status: (eventData.isTrustedDomain && eventData.regLink) ? "approved" : "pending",
      registration_deadline: eventData.isFeatured && eventData.registrationDeadline ? eventData.registrationDeadline.toISOString() : null,
      branch_tags: isCollegeCategory && eventData.collegeBranch && eventData.collegeBranch !== "All Branches" ? [eventData.collegeBranch] : null,
      college_branch: isCollegeCategory && eventData.collegeBranch && eventData.collegeBranch !== "All Branches" ? eventData.collegeBranch : null,
      college_year: isCollegeCategory && eventData.collegeYear && eventData.collegeYear !== "All Years" ? eventData.collegeYear : null,
      college_only: isCollegeCategory && eventData.collegeId ? eventData.collegeOnly : false,
      college_id: isCollegeCategory ? eventData.collegeId : null,
      imageFile: crop.imageFile, 
      previewUrl: crop.previewUrl
    }, isEditing, initialData?.id);
    if (res && res.success) {
      clearDraft();
      if (!isEditing) {
        setCelebrationEvent(res as any);
        setIsCelebrationOpen(true);
      }
    }
  };

  const step0Valid = eventData.title && eventData.description && eventData.category && eventData.selectedDate && (eventData.isOnline ? eventData.regLink : (eventData.location && eventData.city));

  return (
    <div className="max-w-3xl mx-auto w-full">
      {hasRestoredDraft && (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-200/80 rounded-2xl px-4 py-2.5 mb-6 animate-in fade-in">
          <span className="text-xs sm:text-sm font-semibold text-purple-900">
            Draft restored from your last session.
          </span>
          <button
            type="button"
            onClick={clearDraft}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline ml-3"
          >
            Clear Draft
          </button>
        </div>
      )}
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">
          {step === 0 ? "Event Details" : "Feature & Advanced Setup"}
        </h1>
        <p className="text-slate-500 text-sm">
          {step === 0 ? "All the essential details for your event." : "Make your event stand out."}
        </p>
      </div>

      <div className="relative bg-[#F8F9FB] p-6 md:p-10 rounded-[32px] border border-slate-200 shadow-sm min-h-85">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepMandatory profileCollege={profileCollege} 
              data={eventData} 
              updateData={updateData} 
              isCollegeCategory={isCollegeCategory}
              extraction={extraction}
              onNext={() => setStep(1)}
              isValid={Boolean(step0Valid)}
              isSubmitting={isSubmitting && !isAdminFeatureEnabled}
              onSubmit={handleSubmit}
              isAdminFeatureEnabled={isAdminFeatureEnabled}
              isCurrentUserAdmin={isCurrentUserAdmin}
              isEditing={isEditing}
            />
          )}
            {step === 1 && (
              <StepFeatured 
                data={eventData} 
                updateData={updateData} 
                crop={crop}
                onBack={() => setStep(0)} 
                onSubmit={handleSubmit} 
                isSubmitting={isSubmitting}
                isEditing={isEditing}
                isAdminFeatureEnabled={isAdminFeatureEnabled}
              />
            )}
        </AnimatePresence>
      </div>

      <CuratorCelebrationModal
        isOpen={isCelebrationOpen}
        event={celebrationEvent}
        onClose={() => {
          setIsCelebrationOpen(false);
          window.location.href = "/";
        }}
        onViewEvent={(slug) => {
          setIsCelebrationOpen(false);
          window.location.href = "/events/" + (slug || "");
        }}
      />
    </div>
  );
}