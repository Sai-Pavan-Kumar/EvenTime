"use client";

import { useState, useEffect, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { FieldStatus, CreateEventFormProps } from "./types";
import { CATEGORY_TEMPLATES, categoriesList, audienceOptions, teamOptions, hours, mins, ampms } from "./constants";
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

interface ExtendedFormProps extends CreateEventFormProps {
  isAdminFeatureEnabled?: boolean; // Controls if the Featured section is visible
}

export function CreateEventForm({ initialData, isEditing = false, isAdminFeatureEnabled = false }: ExtendedFormProps) {
  const [step, setStep] = useState(0); // 0 = Mandatory, 1 = Featured/Advanced
  const supabase = createClient();

  // Unified State Object
  const [eventData, setEventData] = useState({
    regLink: initialData?.registration_link || "",
    isTrustedDomain: true,
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
    collegeName: "",
    selectedHour: initialData?.start_time ? initialData.start_time.split(":")[0] : "06",
    selectedMin: initialData?.start_time ? initialData.start_time.split(":")[1].substring(0, 2) : "00",
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

  const extraction = useEventExtraction({ 
    setTitle: (v) => updateData({ title: v }), 
    setDescription: (v) => updateData({ description: v }), 
    setLocation: (v) => updateData({ location: v }), 
    setSelectedDate: (v) => updateData({ selectedDate: v }), 
    setFieldStatus: (v) => updateData({ fieldStatus: typeof v === 'function' ? v(eventData.fieldStatus) : v }), 
    initialLink: initialData?.registration_link ?? undefined 
  });
  
  const crop = useImageCrop(initialData?.poster_url ?? undefined);
  const { isSubmitting, submitEvent } = useEventSubmit();

   // Re-run domain trust check on edit load so isTrustedDomain reflects the real status
  useEffect(() => {
    if (isEditing && initialData?.registration_link) {
      extraction.handleLinkInput(initialData.registration_link);
    }
  }, []);

  const handleSubmit = () => {
    submitEvent({
      title: eventData.title,
      category: eventData.category,
      organizer_name: eventData.organizer,
      description: eventData.description,
      target_audience: eventData.selectedAudience,
      start_time: `${eventData.selectedHour}:${eventData.selectedMin} ${eventData.selectedAmPm}`,
      end_time: eventData.hasEndTime ? `${eventData.endHour}:${eventData.endMin} ${eventData.endAmPm}` : null,
      end_date_string: eventData.hasEndTime && eventData.endDate ? toLocalDateString(eventData.endDate) : null,
      date_string: eventData.selectedDate ? toLocalDateString(eventData.selectedDate) : "",
      location: eventData.isOnline ? "Virtual Event" : eventData.location,
      city: eventData.isOnline ? "online" : eventData.city,
      is_virtual: eventData.isOnline,
      is_free: eventData.isFree,
      price: eventData.isFree ? 0 : Number(eventData.price),
      registration_link: eventData.regLink,
      prizes: eventData.prizes,
      team_size: eventData.teamSize,
      website: eventData.website,
      is_featured: eventData.isFeatured,
      status: eventData.isTrustedDomain ? "approved" : "pending",
      registration_deadline: eventData.registrationDeadline ? eventData.registrationDeadline.toISOString() : null,
      branch_tags: isCollegeCategory && eventData.collegeBranch ? [eventData.collegeBranch] : null,
      college_branch: isCollegeCategory ? eventData.collegeBranch : null,
      college_year: isCollegeCategory ? eventData.collegeYear : null,
      college_only: isCollegeCategory ? eventData.collegeOnly : null,
      college_id: isCollegeCategory && eventData.collegeOnly ? eventData.collegeId : null,
      imageFile: crop.imageFile, 
      previewUrl: crop.previewUrl
    }, isEditing, initialData?.id);
  };

  const step0Valid = eventData.regLink && eventData.title && eventData.description && eventData.category && eventData.selectedAudience.length > 0 && eventData.selectedDate && (eventData.isOnline || (eventData.location && eventData.city));

  return (
    <div className="max-w-3xl mx-auto w-full">
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
            <StepMandatory 
              data={eventData} 
              updateData={updateData} 
              isCollegeCategory={isCollegeCategory}
              extraction={extraction}
              onNext={() => {
                if (isAdminFeatureEnabled) setStep(1);
                else handleSubmit(); // Skip straight to submit if feature is off
              }}
              isValid={Boolean(step0Valid)}
              isSubmitting={isSubmitting && !isAdminFeatureEnabled}
              onSubmit={handleSubmit}
              isAdminFeatureEnabled={isAdminFeatureEnabled}
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
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}