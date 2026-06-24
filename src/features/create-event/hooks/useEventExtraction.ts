import { useState } from "react";
import { useDuplicateCheck } from "./useDuplicateCheck";
import type { EventRow } from "@/types";
import type { FieldStatus } from "../types";

interface ExtractionProps {
  setTitle: (t: string) => void;
  setDescription: (d: string) => void;
  setLocation: (l: string) => void;
  setSelectedDate: (d: Date) => void;
  setFieldStatus: React.Dispatch<React.SetStateAction<Record<string, FieldStatus>>>;
  initialLink?: string;
  currentEventId?: string;
}

export function useEventExtraction({ setTitle, setDescription, setLocation, setSelectedDate, setFieldStatus, initialLink, currentEventId  }: ExtractionProps) {
  const [regLink, setRegLink] = useState(initialLink || "");
  const [isExtracting, setIsExtracting] = useState(false);
  const [linkDuplicateError, setLinkDuplicateError] = useState("");
  const [extractError, setExtractError] = useState("");
  const [isTrusted, setIsTrusted] = useState(false);
  const [trustWarning, setTrustWarning] = useState("");
  const [extractionConfidence, setExtractionConfidence] = useState<number>(0);
  
  const { checkDuplicateLink } = useDuplicateCheck();

  const handleLinkInput = async (val: string) => {
    setRegLink(val);
    setLinkDuplicateError("");
    setExtractError("");

    if (!val) {
      setTitle(""); setDescription(""); setTrustWarning(""); setIsTrusted(false);
      setFieldStatus({ title: "idle", description: "idle", location: "idle" });
      return;
    }
    if (!val.startsWith("http")) return;

    setIsExtracting(true);
    try {
      const existing = await checkDuplicateLink(val, currentEventId);
      if (existing) {
        setLinkDuplicateError(`This event was already posted as "${existing.title}".`);
        setIsExtracting(false); return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: val }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      const confidence: number = data.confidence ?? 0;
      setExtractionConfidence(confidence);

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.date) {
        const parsedDate = new Date(data.date);
        if (!isNaN(parsedDate.getTime())) setSelectedDate(parsedDate);
      }
      if (data.location) setLocation(data.location);

      if (data.finalUrl && data.finalUrl !== val) {
        setRegLink(data.finalUrl);
      }

      const isHigh = confidence >= 0.8;
      setFieldStatus({
        title: data.title ? (isHigh ? "success" : "warning") : "idle",
        description: data.description ? (isHigh ? "success" : "warning") : "idle",
        location: data.location ? (isHigh ? "success" : "warning") : "idle",
      });

      setIsTrusted(data.isTrusted === true);
      if (data.isTrusted === false) {
        setTrustWarning("This link cannot be verified. Wait for the event to get approved.");
      } else {
        setTrustWarning("");
      }

      if (!data.title) {
        setExtractError("Could not fetch details, please enter manually");
      }
    } catch (err) {
      setExtractError("Could not fetch details, please enter manually");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSkipLink = (setStep: (s: number) => void) => {
    setRegLink("");
    setLinkDuplicateError("");
    setExtractError("");
    setTrustWarning("");
    setStep(1);
  };

  return {
    regLink, setRegLink, isExtracting, linkDuplicateError, extractError,
    isTrusted, trustWarning, extractionConfidence, handleLinkInput, handleSkipLink
  };
}