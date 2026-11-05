"use client";

import { useState, useEffect, useRef, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FieldStatus, CreateEventFormProps } from "./types";
import { EMPTY_EVENT_FORM } from "./constants";
import { validateEventForm } from "./utils/validateEventForm";
function collegeAudience(selected: string[]) {
  const audience = selected.filter((group) => group !== "Everyone");
  return audience.length > 0 ? audience : ["College Students"];
}
function toLocalDateString(d: Date) { 
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Hooks
import { useAuth } from "@/context/AuthContext";
import { useImageCrop } from "./hooks/useImageCrop";
import { useEventSubmit } from "./hooks/useEventSubmit";

// New 2-Step Components
import { StepMandatory } from "./components/StepMandatory";
import { StepFeatured } from "./components/StepFeatured";
import { CuratorCelebrationModal, CelebrationEventData } from "./components/CuratorCelebrationModal";
import { toast } from "sonner";
import { isVerifiedDomain } from "@/lib/constants/verifiedDomains";
import { CITIES } from "@/lib/constants/cities";

interface ExtendedFormProps extends CreateEventFormProps {
  isAdminFeatureEnabled?: boolean; // Controls if the Featured section is visible
  isCurrentUserAdmin?: boolean; // FIX: Controls the admin warnings
}

export function CreateEventForm({ initialData, isEditing = false, isAdminFeatureEnabled = false, isCurrentUserAdmin = false }: ExtendedFormProps) {
  const [step, setStep] = useState(0); // 0 = Mandatory, 1 = Featured/Advanced
  const [celebrationEvent, setCelebrationEvent] = useState<CelebrationEventData | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [formError, setFormError] = useState("");
  const submissionId = useRef(typeof crypto !== "undefined" ? crypto.randomUUID?.() : undefined);
  const DRAFT_STORAGE_KEY = "@eventime_create_event_draft_v1";
  const { user, profile } = useAuth();

  // Unified State Object
  const [eventData, setEventData] = useState({
    regLink: initialData?.registration_link || "",
    isTrustedDomain: initialData?.status ? initialData.status === "approved" : (initialData?.registration_link ? isVerifiedDomain(initialData.registration_link) : true),
    title: initialData?.title || "",
    category: initialData?.category || "",
    isCreatingNewCategory: false,
    selectedAudience: initialData?.target_audience || [],
    description: initialData?.description || "",
    // The online placeholders would otherwise show up as a real city and venue if the event moves in person.
    location: initialData?.is_virtual ? "" : initialData?.location || "",
    city: initialData?.is_virtual ? "" : initialData?.city || "",
    selectedDate: (initialData?.date_string ? new Date(initialData.date_string) : undefined) as Date | undefined,
    collegeBranch: initialData?.college_branch || "",
    collegeYear: initialData?.college_year || "",
    collegeOnly: initialData?.college_only || false,
    collegeId: initialData?.college_id || null,
    collegeName: initialData?.colleges?.name || "",
    isCollegeEvent: Boolean(initialData?.college_id),
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
    setFormError("");
  };

  const isCollegeCategory = eventData.isCollegeEvent;

  
  // Auto-restore draft from localStorage
  useEffect(() => {
    if (isEditing || initialData?.title) return;
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && (draft.title || draft.regLink || draft.description || draft.category || draft.isCollegeEvent)) {
          setEventData((prev) => ({
            ...prev,
            ...draft,
            isCollegeEvent: Boolean(draft.isCollegeEvent),
            isTrustedDomain: draft.regLink ? isVerifiedDomain(draft.regLink) : true,
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

  // "Host an event in Kanpur" links here with the city. A saved draft wins, because that is the user's own work.
  useEffect(() => {
    if (isEditing) return;
    const linkedCity = new URLSearchParams(window.location.search).get("city");
    if (linkedCity !== "online" && !CITIES.some((c) => c === linkedCity)) return;
    setEventData((prev) => {
      if (prev.city || prev.isOnline) return prev;
      return linkedCity === "online" ? { ...prev, isOnline: true } : { ...prev, city: linkedCity as string };
    });
  }, [isEditing]);

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
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        console.warn("[CreateEvent] Failed to save draft:", e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [eventData, isEditing]);

  const clearDraft = (announce = false) => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasRestoredDraft(false);
      setEventData(EMPTY_EVENT_FORM as typeof eventData);
      setDuplicateError("");
      setIsCheckingDuplicate(false);
      if (announce) toast.success("Draft cleared");
    } catch (e) {
      console.error(e);
    }
  };

  const [profileCollege, setProfileCollege] = useState<{ id: string; name: string } | null>(null);

  // Auto-prefill student's registered college if creating a college event or fest
  useEffect(() => {
    if (profile?.college_id && profile?.college) {
      setProfileCollege({
        id: profile.college_id,
        name: profile.college,
      });
    }
  }, [profile]);

  // Once per switch-on: refilling whenever the box is empty stopped students typing any other college.
  const hasPrefilledCollege = useRef(false);
  useEffect(() => {
    if (!isCollegeCategory) {
      hasPrefilledCollege.current = false;
      return;
    }
    if (!initialData && profileCollege && !eventData.collegeName && !hasPrefilledCollege.current) {
      hasPrefilledCollege.current = true;
      updateData({
        collegeName: profileCollege.name,
        collegeId: profileCollege.id,
      });
    }
  }, [isCollegeCategory, profileCollege, eventData.collegeName, initialData]);
  
  const crop = useImageCrop(initialData?.poster_url ?? undefined);
  const { isSubmitting, submitEvent } = useEventSubmit();

  const validateMandatoryFields = () => {
    const problem = validateEventForm(eventData, { isEditing, isCollegeEvent: isCollegeCategory, duplicateError, isCheckingDuplicate });
    setFormError(problem?.message ?? "");
    if (!problem) return true;
    toast.error(problem.message);
    if (problem.fieldId) {
      const field = document.getElementById(problem.fieldId);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.focus();
    }
    return false;
  };


  const handleNextStep = () => {
    if (!validateMandatoryFields()) return;
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateMandatoryFields()) return;

    if (!user) {
      toast.error("Please login to post an event.");
      return;
    }

    const res = await submitEvent({
      title: eventData.title,
      category: eventData.category,
      organizer_name: eventData.organizer,
      description: eventData.description,
      // "Everyone" lets an event past the public feed filter, so a college event must never keep it from an earlier edit.
      target_audience: isCollegeCategory ? collegeAudience(eventData.selectedAudience) : ["Everyone"],
      start_time: (eventData.selectedHour && eventData.selectedMin) ? `${eventData.selectedHour}:${eventData.selectedMin} ${eventData.selectedAmPm}` : null,
      end_time: eventData.hasEndTime ? `${eventData.endHour}:${eventData.endMin} ${eventData.endAmPm}` : null,
      end_date_string: eventData.hasEndDate && eventData.endDate ? toLocalDateString(eventData.endDate) : null,
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
      status: (eventData.regLink && isVerifiedDomain(eventData.regLink)) || eventData.isTrustedDomain ? "approved" : "pending",
      registration_deadline: eventData.isFeatured && eventData.registrationDeadline ? eventData.registrationDeadline.toISOString() : null,
      branch_tags: isCollegeCategory && eventData.collegeBranch && eventData.collegeBranch !== "All Branches" ? [eventData.collegeBranch] : null,
      college_branch: isCollegeCategory && eventData.collegeBranch && eventData.collegeBranch !== "All Branches" ? eventData.collegeBranch : null,
      college_year: isCollegeCategory && eventData.collegeYear && eventData.collegeYear !== "All Years" ? eventData.collegeYear : null,
      college_only: isCollegeCategory && eventData.collegeId ? eventData.collegeOnly : false,
      college_id: isCollegeCategory ? eventData.collegeId : null,
      submission_id: submissionId.current,
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

  return (
    <div className="max-w-3xl mx-auto w-full">
      {hasRestoredDraft && (
        <div className="flex items-center justify-between bg-slate-100 rounded-md px-4 py-2.5 mb-6 animate-in fade-in">
          <span className="text-xs sm:text-sm font-medium text-slate-700">
            We kept your draft.
          </span>
          <button
            type="button"
            onClick={() => clearDraft(true)}
            className="min-h-11 text-sm font-semibold text-slate-900 hover:underline ml-3 shrink-0"
          >
            Start over
          </button>
        </div>
      )}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-[-0.03em] text-slate-900 mb-2">
          {step === 1 ? "Feature this event" : isEditing ? "Edit event" : "Post an event"}
        </h1>
        <p className="text-slate-600 text-base">
          {step === 1 ? "Add a poster and the extra details." : isEditing ? "Changing to an unverified link sends the event back for review." : "It takes about a minute."}
        </p>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepMandatory profileCollege={profileCollege} 
              data={eventData} 
              updateData={updateData} 
              isCollegeCategory={isCollegeCategory}
              onNext={handleNextStep}
              formError={formError}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              isAdminFeatureEnabled={isAdminFeatureEnabled}
              isCurrentUserAdmin={isCurrentUserAdmin}
              isEditing={isEditing}
              initialEventId={initialData?.id}
              duplicateError={duplicateError}
              setDuplicateError={setDuplicateError}
              isCheckingDuplicate={isCheckingDuplicate}
              setIsCheckingDuplicate={setIsCheckingDuplicate}
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
          window.location.href = "/events/" + (slug || "");
        }}
      />
    </div>
  );
}