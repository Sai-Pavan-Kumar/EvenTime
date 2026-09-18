import { useState, useRef, useEffect } from "react";
import { useDuplicateCheck } from "./useDuplicateCheck";
import { createClient } from "@/lib/supabase/client";
import { isVerifiedDomain, updateDynamicVerifiedDomains } from "@/lib/constants/verifiedDomains";
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
  const [isTrusted, setIsTrusted] = useState(() => isVerifiedDomain(initialLink) || initialIsTrusted);
  const [trustWarning, setTrustWarning] = useState("");
  const [extractionConfidence, setExtractionConfidence] = useState<number>(0);

  const activeControllerRef = useRef<AbortController | null>(null);
  const { checkDuplicateLink } = useDuplicateCheck();

  const lastExtractedUrlRef = useRef<string>("");

  // Fetch updated list of verified domains from DB ONCE on mount
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("verified_domains")
      .select("domain_name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          updateDynamicVerifiedDomains(data.map((d: { domain_name: string }) => d.domain_name));
          if (regLink) {
            setIsTrusted(isVerifiedDomain(regLink));
          }
        }
      }, () => {});
  }, []); // Run ONCE on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeControllerRef.current?.abort();
    };
  }, []);

  const handleLinkInput = async (val: string) => {
    const trimmed = val.trim();
    setRegLink(trimmed);
    setLinkDuplicateError("");
    setExtractError("");

    if (!trimmed) {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
        activeControllerRef.current = null;
      }
      lastExtractedUrlRef.current = "";
      setIsExtracting(false);
      setTitle(""); setDescription(""); setTrustWarning(""); setIsTrusted(false);
      setFieldStatus({ title: "idle", description: "idle", location: "idle" });
      return;
    }

    // Instantly verify domain from verified domains list (0ms latency, works offline/unauthenticated)
    const instantTrusted = isVerifiedDomain(trimmed);
    setIsTrusted(instantTrusted);
    if (instantTrusted) {
      setTrustWarning("");
    } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      if (!isAdmin) {
        setTrustWarning("This link cannot be verified. Wait for the event to get approved.");
      }
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setIsExtracting(false);
      return;
    }

    // Skip if already extracting this exact URL
    if (trimmed === lastExtractedUrlRef.current && isExtracting) {
      return;
    }
    lastExtractedUrlRef.current = trimmed;

    // Abort previous in-flight request if a new URL is entered
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }

    // Generous 10-second client timeout covering duplicate check + API fetch + JSON parsing
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    setIsExtracting(true);
    try {
      const existing = await checkDuplicateLink(trimmed, currentEventId, controller.signal);
      if (existing) {
        setLinkDuplicateError(`This event was already posted as "${existing.title}".`);
        return;
      }

      // Read active Supabase session token to send with request
      const supabase = createClient();
      let accessToken = "";
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token || "";
      } catch {}

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        headers,
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

      const finalTrusted = data.isTrusted === true || instantTrusted || isVerifiedDomain(data.finalUrl || trimmed);
      setIsTrusted(finalTrusted);
      if (!finalTrusted) {
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
        setExtractError("Link extraction timed out. Please enter details manually.");
      } else {
        setExtractError("Could not fetch details, please enter manually");
      }
    } finally {
      clearTimeout(timeoutId);
      if (activeControllerRef.current === controller || activeControllerRef.current === null) {
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