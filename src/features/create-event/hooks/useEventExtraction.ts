import { useState, useRef, useEffect } from "react";
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
  initialIsTrusted?: boolean;
  currentEventId?: string;
  isAdmin?: boolean;
}

export function useEventExtraction({ setTitle, setDescription, setLocation, setSelectedDate, setFieldStatus, initialLink, initialIsTrusted = false, currentEventId, isAdmin = false }: ExtractionProps) {  
  const [regLink, setRegLink] = useState(initialLink || "");
  const [isExtracting, setIsExtracting] = useState(false);
  const [linkDuplicateError, setLinkDuplicateError] = useState("");
  const [extractError, setExtractError] = useState("");
  const [isTrusted, setIsTrusted] = useState(initialIsTrusted);
  const [trustWarning, setTrustWarning] = useState("");
  const [extractionConfidence, setExtractionConfidence] = useState<number>(0);

  const activeControllerRef = useRef<AbortController | null>(null);
  const { checkDuplicateLink } = useDuplicateCheck();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeControllerRef.current?.abort();
    };
  }, []);

  const handleLinkInput = async (val: string) => {
    // Abort any in-flight extraction request immediately
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }

    const trimmed = val.trim();
    setRegLink(trimmed);
    setLinkDuplicateError("");
    setExtractError("");

    if (!trimmed) {
      setIsExtracting(false);
      setTitle(""); setDescription(""); setTrustWarning(""); setIsTrusted(false);
      setFieldStatus({ title: "idle", description: "idle", location: "idle" });
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setIsExtracting(false);
      return;
    }

    // Single unified 5-second client timeout covering duplicate check + API fetch + JSON parsing
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    setIsExtracting(true);
    try {
      const existing = await checkDuplicateLink(trimmed, currentEventId, controller.signal);
      if (existing) {
        setLinkDuplicateError(`This event was already posted as "${existing.title}".`);
        return;
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setExtractError(data.message || "Could not fetch details, please enter manually");
        setFieldStatus({ title: "idle", description: "idle", location: "idle" });
        return;
      }

      const confidence: number = data.confidence ?? 0;
      setExtractionConfidence(confidence);

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.date) {
        const parsedDate = new Date(data.date);
        if (!isNaN(parsedDate.getTime())) setSelectedDate(parsedDate);
      }
      if (data.location) setLocation(data.location);

      if (data.finalUrl && data.finalUrl !== trimmed) {
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
        if (!isAdmin) {
          setTrustWarning("This link cannot be verified. Wait for the event to get approved.");
        } else {
          setTrustWarning("");
        }
      } else {
        setTrustWarning("");
      }

      if (!data.title) {
        setExtractError("Could not fetch details, please enter manually");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (activeControllerRef.current === controller) {
          setExtractError("Link extraction timed out. Please enter details manually.");
        }
      } else {
        setExtractError("Could not fetch details, please enter manually");
      }
    } finally {
      clearTimeout(timeoutId);
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
        setIsExtracting(false);
      }
    }
  };

  const handleSkipLink = (setStep: (s: number) => void) => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
    setIsExtracting(false);
    setRegLink("");
    setLinkDuplicateError("");
    setExtractError("");
    setTrustWarning("");
    setStep(1);
  };

  const abortExtraction = () => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
    setIsExtracting(false);
  };

  return {
    regLink, setRegLink, isExtracting, linkDuplicateError, extractError,
    isTrusted, trustWarning, extractionConfidence, handleLinkInput, handleSkipLink, abortExtraction
  };
}