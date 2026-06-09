"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, UserPlus } from "lucide-react";
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
    if (localStorage.getItem(storageKey)) return;

    const timer = setTimeout(() => setIsVisible(true), 10000);
    return () => clearTimeout(timer);
  }, [profile, user]);

  if (!mounted || !isVisible || isClosed || profile?.is_onboarded) return null;

  const isGuest = !user;
  const storageKey = isGuest ? GUEST_PROMPT_KEY : USER_PROMPT_KEY;

  const handleClose = () => {
    localStorage.setItem(storageKey, "true");
    setIsClosed(true);
  };

  const handleCTA = () => {
    localStorage.setItem(storageKey, "true");
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
              <div className="bg-white border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] rounded-[32px] p-8 relative overflow-hidden">

                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full p-1.5"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    {isGuest
                      ? <UserPlus className="w-6 h-6 text-brand-primary" />
                      : <Sparkles className="w-6 h-6 text-brand-primary" />
                    }
                  </div>
                  <div className="pr-2">
                    <h4 className="text-sm font-heading font-black text-slate-900 mb-1.5 leading-tight">
                      {isGuest ? "Unlock Full Access" : "Complete Your Profile"}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                      {isGuest
                        ? "Sign in to save events, host your own, and get tailored recommendations."
                        : "Tell us your interests to see events that actually matter to you."}
                    </p>
                    <button
                      onClick={handleCTA}
                      className="w-full text-xs font-bold bg-text-primary hover:bg-black text-white px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-black/10"
                    >
                      {isGuest ? "Sign In Now" : "Setup Profile"} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}