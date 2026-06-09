"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bug, Lightbulb, Loader2 } from "lucide-react";
import { submitFeedbackAction } from "@/app/profile/action";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<'bug' | 'feature'>('feature');
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError("");

    const result = await submitFeedbackAction(type, message);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSuccess(false);
      setMessage("");
      setError("");
      setType('feature');
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-10"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-bold text-xl text-slate-900 leading-tight">Feedback</h3>
                <button
                  onClick={handleClose}
                  className="p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-heading font-bold text-lg text-slate-900">Thank You!</h4>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Your feedback helps us improve.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex bg-surface-base p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setType('feature')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        type === 'feature'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Lightbulb className={`w-4 h-4 ${type === 'feature' ? 'text-amber-500' : ''}`} /> Feature
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('bug')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        type === 'bug'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Bug className={`w-4 h-4 ${type === 'bug' ? 'text-red-500' : ''}`} /> Bug
                    </button>
                  </div>

                  <div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={500}
                      placeholder={type === 'feature' ? "What should we add or improve?" : "What went wrong?"}
                      className="w-full bg-surface-base border border-transparent rounded-2xl p-4 text-sm text-text-primary focus:border-[#E5E5EA] focus:bg-white focus:ring-4 focus:ring-brand-primary/10 outline-none resize-none h-32 transition-all placeholder:text-text-secondary"
                      required
                    />
                    <div className="flex justify-end mt-1 px-1">
                      <span className={`text-[11px] font-bold font-['Outfit'] ${message.length >= 500 ? 'text-red-500' : 'text-slate-400'}`}>
                        {message.length} / 500
                      </span>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="w-full bg-text-primary hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Submit"
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}