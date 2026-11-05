import { useCallback, useEffect, useRef, useState } from "react";
import { hours, mins } from "../constants";

export type AutofillStatus = "idle" | "loading" | "filled" | "partial" | "failed";

// The owner's limit: after this the poster should simply carry on by hand.
const EXTRACTION_LIMIT_MS = 4000;
const TITLE_MAX = 100;
const DESCRIPTION_MAX = 3000;
const VENUE_MAX = 150;

function parseLocalDate(value: string): Date | undefined {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
}

// The form's time picker only offers quarter hours. Rounding would publish a wrong time, so anything else stays blank.
function parseTime(value: string): { hour: string; minute: string; ampm: string } | null {
  const match = value?.match(/^(\d{2}):(\d{2}) (AM|PM)$/);
  if (!match || !hours.includes(match[1]) || !mins.includes(match[2])) return null;
  return { hour: match[1], minute: match[2], ampm: match[3] };
}

function isBookableDate(date: Date | undefined): date is Date {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latest = new Date(today);
  latest.setFullYear(today.getFullYear() + 1);
  return date >= today && date <= latest;
}

/** Only empty fields are returned: whatever the poster typed while we waited is theirs. */
function buildFill(extracted: any, current: any) {
  const fill: Record<string, unknown> = {};

  if (extracted.title && !current.title) fill.title = extracted.title.slice(0, TITLE_MAX);
  if (extracted.description && !current.description) fill.description = extracted.description.slice(0, DESCRIPTION_MAX);

  const startDate = parseLocalDate(extracted.startDate);
  if (isBookableDate(startDate) && !current.selectedDate) {
    fill.selectedDate = startDate;
    const endDate = parseLocalDate(extracted.endDate);
    if (endDate && endDate > startDate && !current.hasEndDate) {
      fill.hasEndDate = true;
      fill.endDate = endDate;
    }
  }

  const startTime = parseTime(extracted.startTime);
  if (startTime && !current.selectedHour) {
    fill.selectedHour = startTime.hour;
    fill.selectedMin = startTime.minute;
    fill.selectedAmPm = startTime.ampm;
    const endTime = parseTime(extracted.endTime);
    if (endTime && !current.hasEndTime) {
      fill.hasEndTime = true;
      fill.endHour = endTime.hour;
      fill.endMin = endTime.minute;
      fill.endAmPm = endTime.ampm;
    }
  }

  if (!current.city && !current.isOnline) {
    if (extracted.isOnline) fill.isOnline = true;
    else if (extracted.city) {
      fill.city = extracted.city;
      fill.location = extracted.location && !current.location ? extracted.location.slice(0, VENUE_MAX) : extracted.city;
    }
  }
  return fill;
}

function isComplete(extracted: any) {
  return Boolean(extracted.title && extracted.description && parseLocalDate(extracted.startDate) && (extracted.city || extracted.isOnline));
}

export function useLinkAutofill(data: any, updateData: (updates: any) => void) {
  const [status, setStatus] = useState<AutofillStatus>("idle");
  const controllerRef = useRef<AbortController | null>(null);
  const latestData = useRef(data);
  useEffect(() => {
    latestData.current = data;
  }, [data]);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const extract = useCallback(async (url: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("loading");
    const limitTimer = setTimeout(() => controller.abort(), EXTRACTION_LIMIT_MS);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      const extracted = await res.json();
      if (controllerRef.current !== controller) return;

      const fill = res.ok ? buildFill(extracted, latestData.current) : {};
      if (Object.keys(fill).length === 0) {
        setStatus("failed");
        return;
      }
      updateData(fill);
      setStatus(isComplete(extracted) ? "filled" : "partial");
    } catch {
      // A newer link or a cancel has already taken over; only our own time limit reports failure.
      if (controllerRef.current === controller) setStatus("failed");
    } finally {
      clearTimeout(limitTimer);
    }
  }, [updateData]);

  return { status, extract, cancel };
}
