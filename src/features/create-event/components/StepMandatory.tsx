"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "@/components/icons";
import { isVerifiedDomain } from "@/lib/constants/verifiedDomains";
import { categoriesList } from "../constants";
import { CurrencySelect } from "./CurrencySelect";
import { CollegeFields } from "./CollegeFields";
import { FIELD_CLASS, FieldLabel, Segmented, Select, Switch } from "./FormControls";
import { RegistrationLinkField } from "./RegistrationLinkField";
import { SimilarEventNotice } from "./SimilarEventNotice";
import { useSimilarEvent } from "../hooks/useSimilarEvent";
import { toLocalDateString } from "../utils/eventSubmission";
import { WhenSection } from "./WhenSection";
import { WhereSection } from "./WhereSection";

const PRICE_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];
const PRICE_TYPE_OPTIONS = [
  { value: "fixed", label: "Fixed price" },
  { value: "starting", label: "Starting price" },
];
const SUBMIT_BUTTON_CLASS =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-10 text-base font-bold text-white transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate-200 py-8 first:border-t-0 first:pt-0">
      <h2 className="mb-5 font-heading text-xl font-bold tracking-[-0.01em] text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function StepMandatory({
  data,
  updateData,
  isCollegeCategory,
  onNext,
  formError,
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
  const isAdmin = isCurrentUserAdmin;
  const isLinkVerified = !data.regLink || isVerifiedDomain(data.regLink);
  const isBlocked = isSubmitting || isCheckingDuplicate || Boolean(duplicateError);
  const similarEvent = useSimilarEvent({
    title: data.title,
    city: data.isOnline ? "online" : data.city,
    dateString: data.selectedDate ? toLocalDateString(data.selectedDate) : "",
    currentEventId: initialEventId,
  });

  // College events default their audience, so the poster never has to pick one.
  useEffect(() => {
    if (isCollegeCategory && data.selectedAudience.length === 0) {
      updateData({ selectedAudience: ["College Students"] });
    }
  }, [isCollegeCategory, data.selectedAudience.length, updateData]);

  const toggleCollegeEvent = () => {
    const next = !data.isCollegeEvent;
    updateData({
      isCollegeEvent: next,
      ...(next ? {} : { collegeId: null, collegeName: "", collegeBranch: "", collegeYear: "", collegeOnly: false }),
    });
  };

  const submitLabel = isEditing ? "Update event" : isLinkVerified ? "Post event" : "Submit for review";
  const submittingLabel = isEditing ? "Updating..." : isLinkVerified ? "Posting..." : "Submitting...";

  return (
    <motion.div key="stepMandatory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <Section title="The basics">
        <div className="space-y-5">
          <RegistrationLinkField
            data={data}
            updateData={updateData}
            isAdmin={isAdmin}
            initialEventId={initialEventId}
            duplicateError={duplicateError}
            setDuplicateError={setDuplicateError}
            isCheckingDuplicate={isCheckingDuplicate}
            setIsCheckingDuplicate={setIsCheckingDuplicate}
          />
          <div>
            <FieldLabel htmlFor="event-title-input" count={(data.title || "").length} max={100}>Event title</FieldLabel>
            <input
              id="event-title-input"
              type="text"
              value={data.title}
              maxLength={100}
              onChange={(e) => updateData({ title: e.target.value })}
              placeholder="Hyderabad AI Builders Meetup"
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <Select id="event-category-select" label="Category" placeholder="Select category" value={data.category} options={categoriesList} onChange={(category) => updateData({ category })} />
          </div>
          <div>
            <FieldLabel htmlFor="event-description-input" count={(data.description || "").length} max={3000}>Description</FieldLabel>
            <textarea
              id="event-description-input"
              value={data.description}
              maxLength={3000}
              onChange={(e) => updateData({ description: e.target.value })}
              placeholder="What will happen, and who is it for?"
              className={`${FIELD_CLASS} min-h-32 resize-y leading-relaxed`}
            />
          </div>
          <Switch checked={data.isCollegeEvent} onChange={toggleCollegeEvent} label="College or campus event" hint="Hosted by, or linked to, a college." />
          {isCollegeCategory && <CollegeFields data={data} updateData={updateData} profileCollege={profileCollege} />}
        </div>
      </Section>

      <Section title="When">
        <WhenSection data={data} updateData={updateData} />
      </Section>

      <Section title="Where">
        <WhereSection data={data} updateData={updateData} />
      </Section>

      <Section title="Tickets">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Price</FieldLabel>
              <Segmented
                label="Price"
                value={data.isFree ? "free" : "paid"}
                options={PRICE_OPTIONS}
                onChange={(price) => updateData(price === "free" ? { isFree: true, price: "" } : { isFree: false })}
              />
            </div>
            {!data.isFree && (
              <div>
                <FieldLabel htmlFor="event-price-input">Ticket price</FieldLabel>
                <div className="flex gap-2">
                  <CurrencySelect value={data.priceCurrency} onChange={(priceCurrency) => updateData({ priceCurrency })} />
                  <input
                    id="event-price-input"
                    type="text"
                    inputMode="numeric"
                    value={data.price}
                    onChange={(e) => updateData({ price: e.target.value.replace(/[^0-9]/g, "").slice(0, 7) })}
                    placeholder="499"
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
            )}
          </div>
          {!data.isFree && (
            <Segmented
              label="Price type"
              value={data.priceIsStarting ? "starting" : "fixed"}
              options={PRICE_TYPE_OPTIONS}
              onChange={(type) => updateData({ priceIsStarting: type === "starting" })}
            />
          )}
          {isAdmin && isAdminFeatureEnabled && (
            <Switch checked={data.isFeatured} onChange={() => updateData({ isFeatured: !data.isFeatured })} label="Feature this event" hint="Add a poster and advanced details." />
          )}
        </div>
      </Section>

      <div className="border-t border-slate-200 pt-6">
        {similarEvent && <SimilarEventNotice event={similarEvent} />}
        {formError && <p role="alert" className="mb-4 text-sm font-medium text-red-600">{formError}</p>}
        {isAdmin && isAdminFeatureEnabled && data.isFeatured ? (
          <button type="button" onClick={onNext} disabled={isBlocked} className={`${SUBMIT_BUTTON_CLASS} bg-slate-900 hover:bg-black`}>
            Continue
          </button>
        ) : (
          <button type="button" onClick={onSubmit} disabled={isBlocked} className={`${SUBMIT_BUTTON_CLASS} bg-brand-primary hover:bg-[#5835e5]`}>
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
