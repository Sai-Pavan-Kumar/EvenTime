import { useState, useRef, useEffect, useCallback } from "react";
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

export function useEventExtraction({ 
  setTitle, 
  setDescription, 
  setLocation, 
  setSelectedDate, 
  setFieldStatus, 
  initialLink, 
  initialIsTrusted = false, 
  currentEventId, 
  isAdmin = false 
}: ExtractionProps) {  
  const [regLink, setRegLink] = useState(initialLink || "");
  const [isExtracting, setIsExtracting] = useState(false);
  const [linkDuplicateError, setLinkDuplicateError] = useState("");
  const [extractError, setExtractError] = useState("");
  const [isTrusted, setIsTrusted] = useState(() => isVerifiedDomain(initialLink) || initialIsTrusted);
  const [trustWarning, setTrustWarning] = useState("");
  const [extractionConfidence, setExtractionConfidence] = useState<number>(0);

  const activeControllerRef = useRef<AbortController | null>(null);
  const isAbortedSilentlyRef = useRef<boolean>(false);
  const linkDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastExtractedUrlRef = useRef<string>("");
  const { checkDuplicateLink } = useDuplicateCheck();

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
      if (linkDebounceTimerRef.current) {
        clearTimeout(linkDebounceTimerRef.current);
      }
      isAbortedSilentlyRef.current = true;
      activeControllerRef.current?.abort();
    };
  }, []);

  const abortExtraction = useCallback(() => {
    if (linkDebounceTimerRef.current) {
      clearTimeout(linkDebounceTimerRef.current);
      linkDebounceTimerRef.current = null;
    }
    isAbortedSilentlyRef.current = true;
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
    setIsExtracting(false);
    setExtractError("");
  }, []);

  const processLink = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setIsExtracting(false);
      return;
    }

    // Auto-normalize protocol if user types/pastes "lu.ma/xxx" without http/https (matching mobile app)
    const normalizedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    // Instant trust check from domain
    const instantTrusted = isVerifiedDomain(normalizedUrl);
    setIsTrusted(instantTrusted);
    if (instantTrusted) {
      setTrustWarning("");
    } else if (!isAdmin) {
      setTrustWarning("This link cannot be verified. Wait for the event to get approved.");
    } else {
      setTrustWarning("");
    }

    // Skip if already extracting this exact URL
    if (normalizedUrl === lastExtractedUrlRef.current && isExtracting) {
      return;
    }
    lastExtractedUrlRef.current = normalizedUrl;

    // Abort previous in-flight request silently
    isAbortedSilentlyRef.current = true;
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
    isAbortedSilentlyRef.current = false;

    // Generous 15-second client timeout covering duplicate check + API fetch + JSON parsing
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    setIsExtracting(true);
    setLinkDuplicateError("");
    setExtractError("");

    try {
      // 1. Duplicate check with abort signal
      const existing = await checkDuplicateLink(normalizedUrl, currentEventId, controller.signal);
      if (existing) {
        setLinkDuplicateError(`This event was already posted as "${existing.title}".`);
        setIsExtracting(false);
        return;
      }

      // 2. Read active Supabase session token to send with request
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

      // 3. Call /api/extract
      const res = await fetch("/api/extract", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: normalizedUrl }),
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

      if (data.finalUrl && data.finalUrl !== normalizedUrl) {
        setRegLink(data.finalUrl);
      }

      const isHigh = confidence >= 0.8;
      setFieldStatus({
        title: data.title ? (isHigh ? "success" : "warning") : "idle",
        description: data.description ? (isHigh ? "success" : "warning") : "idle",
        location: data.location ? (isHigh ? "success" : "warning") : "idle",
      });

      const finalTrusted = data.isTrusted === true || instantTrusted || isVerifiedDomain(data.finalUrl || normalizedUrl);
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
      // If manually aborted due to user typing or form submit, stay silent!
      if (isAbortedSilentlyRef.current) {
        return;
      }
      if (err instanceof Error && err.name === "AbortError") {
        setExtractError("Link extraction timed out. Please enter details manually.");
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

  const handleLinkInput = (val: string) => {
    const trimmed = val.trim();
    setRegLink(trimmed);
    setLinkDuplicateError("");
    setExtractError("");

    if (linkDebounceTimerRef.current) {
      clearTimeout(linkDebounceTimerRef.current);
      linkDebounceTimerRef.current = null;
    }

    if (!trimmed) {
      abortExtraction();
      lastExtractedUrlRef.current = "";
      setTitle("");
      setDescription("");
      setTrustWarning("");
      setIsTrusted(false);
      setFieldStatus({ title: "idle", description: "idle", location: "idle" });
      return;
    }

    // Instant fast-path trust check for UI feedback
    const normalizedCandidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const instantTrusted = isVerifiedDomain(normalizedCandidate);
    setIsTrusted(instantTrusted);
    if (instantTrusted) {
      setTrustWarning("");
    }

    // Only attempt extraction if it looks like a valid domain or URL (contains a dot or starts with http)
    if (!trimmed.includes(".") && !trimmed.startsWith("http")) {
      setIsExtracting(false);
      return;
    }

    // 450ms debounce before starting extraction
    linkDebounceTimerRef.current = setTimeout(() => {
      processLink(trimmed);
    }, 450);
  };

  const handleSkipLink = (setStep: (s: number) => void) => {
    abortExtraction();
    setRegLink("");
    setLinkDuplicateError("");
    setExtractError("");
    setTrustWarning("");
    setStep(1);
  };

  return {
    regLink, setRegLink, isExtracting, linkDuplicateError, extractError,
    isTrusted, trustWarning, extractionConfidence, handleLinkInput, handleSkipLink, abortExtraction
  };
}