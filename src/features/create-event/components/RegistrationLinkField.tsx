"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Info, Link2, Loader2 } from "@/components/icons";
import { useDuplicateCheck } from "@/features/create-event/hooks/useDuplicateCheck";
import { useLinkAutofill, type AutofillStatus } from "@/features/create-event/hooks/useLinkAutofill";
import { isVerifiedDomain } from "@/lib/constants/verifiedDomains";
import { FIELD_CLASS, FieldLabel } from "./FormControls";

const DUPLICATE_CHECK_DELAY_MS = 450;
const TYPING_PAUSE_MS = 600;

const AUTOFILL_MESSAGES: Partial<Record<AutofillStatus, string>> = {
  loading: "Getting the event details...",
  filled: "Details filled from the link. Please check them.",
  partial: "We filled what we could. Please add the rest.",
  failed: "We couldn't get the details from this link. Please fill them in yourself.",
};

export function RegistrationLinkField({ data, updateData, isAdmin, initialEventId, duplicateError, setDuplicateError, isCheckingDuplicate, setIsCheckingDuplicate }: any) {
  const { checkDuplicateLink } = useDuplicateCheck();
  const lastCheckedUrlRef = useRef<string>("");
  const isLinkVerified = !data.regLink || isVerifiedDomain(data.regLink);
  const { status: autofillStatus, extract, cancel } = useLinkAutofill(data, updateData);
  const wasPasted = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  useEffect(() => {
    const trimmed = (data.regLink || "").trim();
    if (!trimmed || trimmed.length < 5) {
      lastCheckedUrlRef.current = "";
      setDuplicateError?.("");
      setIsCheckingDuplicate?.(false);
      return;
    }

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
        setDuplicateError?.(existing ? `This event was already posted as "${existing.title}".` : "");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("[RegistrationLinkField] checkDuplicateLink error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingDuplicate?.(false);
        }
      }
    }, DUPLICATE_CHECK_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [data.regLink, initialEventId, checkDuplicateLink, setDuplicateError, setIsCheckingDuplicate]);

  const handleLinkInput = (url: string) => {
    updateData({ regLink: url, isTrustedDomain: isVerifiedDomain(url) });
    if (url.trim() !== lastCheckedUrlRef.current) {
      setDuplicateError?.("");
    }

    clearTimeout(typingTimer.current);
    const delay = wasPasted.current ? 0 : TYPING_PAUSE_MS;
    wasPasted.current = false;
    cancel();

    // Editing keeps the saved event as it is, and unverified sites are never fetched from the form.
    const trimmed = url.trim();
    if (initialEventId || !trimmed.includes(".") || !isVerifiedDomain(trimmed)) return;
    const fullUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    typingTimer.current = setTimeout(() => extract(fullUrl), delay);
  };

  let statusIcon = null;
  if (duplicateError) statusIcon = <AlertCircle className="h-5 w-5 text-red-500" />;
  else if (isCheckingDuplicate) statusIcon = <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />;
  else if (data.regLink && isLinkVerified) statusIcon = <CheckCircle2 className="h-5 w-5 text-emerald-600" />;

  return (
    <div>
      <FieldLabel htmlFor="event-reg-link-input" optional={!data.isOnline}>Registration link</FieldLabel>
      <div className="relative">
        <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="event-reg-link-input"
          type="url"
          inputMode="url"
          value={data.regLink}
          maxLength={500}
          aria-invalid={Boolean(duplicateError)}
          onPaste={() => { wasPasted.current = true; }}
          onChange={(e) => handleLinkInput(e.target.value)}
          placeholder="lu.ma, unstop, eventbrite or your own page"
          className={`${FIELD_CLASS} pl-10 pr-11 ${duplicateError ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{statusIcon}</div>
      </div>

      {duplicateError && (
        <p role="alert" className="mt-2 text-[13px] font-medium leading-snug text-red-600">{duplicateError}</p>
      )}
      {!duplicateError && AUTOFILL_MESSAGES[autofillStatus as AutofillStatus] && (
        <p role="status" className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-slate-600">
          {autofillStatus === "loading" ? <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-brand-primary" /> : <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />}
          {AUTOFILL_MESSAGES[autofillStatus as AutofillStatus]}
        </p>
      )}
      {!duplicateError && !isLinkVerified && !isAdmin && (
        <p className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-slate-600">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          We don&apos;t recognise this site yet, so an admin reviews the event before it goes live.
        </p>
      )}
    </div>
  );
}
