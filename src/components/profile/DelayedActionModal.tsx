"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, UserPlus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AuthUser, ProfileRow } from "@/types";

interface DelayedPromptProps {
  user: AuthUser | null;
  profile: Partial<ProfileRow> | null;
  onOpen: () => void;
}

const GUEST_PROMPT_KEY = "EvevnTime_guest_prompt_seen";
const USER_PROMPT_KEY = "EvenTime_user_prompt_seen";

export function DelayedPrompt({ user, profile, onOpen }: DelayedPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (profile?.is_onboarded) return;

    const storageKey = !user ? GUEST_PROMPT_KEY : USER_PROMPT_KEY;
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch (e) {}

    const timer = setTimeout(() => setIsVisible(true), 10000);
    return () => clearTimeout(timer);
  }, [profile, user]);

  if (!mounted || !isVisible || isClosed || profile?.is_onboarded) return null;

  const isGuest = !user;
  const storageKey = isGuest ? GUEST_PROMPT_KEY : USER_PROMPT_KEY;

  const handleClose = () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch (e) {}
    setIsClosed(true);
  };

  const handleCTA = () => {
     try {
      localStorage.setItem(storageKey, "true");
    } catch (e) {}
    setIsClosed(true);
    if (isGuest) {
      router.push("/login");
    } else {
      onOpen();
    }
  };

  return createPortal(
    <AnimatePresence>
      {!isClosed && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: "fixed", inset: 0, zIndex: 99998 }}
            className="bg-slate-900/60 pointer-events-auto"
          />

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                width: "100%",
                maxWidth: "360px",
                pointerEvents: "auto",
              }}
            >
                              <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)] flex flex-col p-8 text-center relative z-10">
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 hover:bg-[#E8E5FF] hover:text-brand-primary rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
  
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 mt-2 shrink-0">
                    {isGuest
                      ? <UserPlus className="w-6 h-6 text-brand-primary" />
                      : <Settings className="w-6 h-6 text-brand-primary" />
                    }
                  </div>
                  
                  <h4 className="font-heading font-bold text-xl text-slate-900 leading-tight">
                    {isGuest ? "Unlock Full Access" : "Complete Your Profile"}
                  </h4>
                  <p className="text-[15px] text-slate-500 mt-2 mb-6 font-medium">
                    {isGuest
                      ? "Sign in to save events, host your own, and get tailored recommendations."
                      : "Tell us your interests to see events that actually matter to you."}
                  </p>
                  <button
                    onClick={handleCTA}
                    className="w-full bg-[#6C47FF] text-white font-bold py-3.5 rounded-full hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#6C47FF]/20"
                  >
                    {isGuest ? "Sign In Now" : "Setup Profile"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}