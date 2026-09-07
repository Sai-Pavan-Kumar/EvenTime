import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | EvenTime",
  description: "Terms of Service and curator community guidelines for EvenTime.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-surface-base pb-24">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-200/60">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-brand-primary text-xs font-bold rounded-full border border-purple-200 mb-4">
            <FileText className="w-4 h-4" />
            <span>EvenTime Terms</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 mb-2">
            Terms of Service & Guidelines
          </h1>
          <p className="text-slate-400 font-medium text-sm mb-8">Last updated: June 30, 2026</p>

          <div className="h-px bg-slate-100 mb-8" />

          <div className="space-y-8 text-slate-700 leading-relaxed text-[15px]">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p className="text-slate-600">
                By creating an account or accessing EvenTime, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the application.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">2. Curator Community Guidelines</h2>
              <p className="text-slate-600">
                EvenTime is a curated directory powered by community organizers. Curators must only post genuine, accurate, and non-misleading event listings. Spam, scams, or posting duplicate events to artificially inflate ET Scores will result in immediate moderation and score resets.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">3. Content Ownership & Verification</h2>
              <p className="text-slate-600">
                Event posters, brand logos, and external ticket links belong to their respective organizers and creators. EvenTime does not host ticket payments directly unless specified.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">4. Account Termination</h2>
              <p className="text-slate-600">
                Users have the right to terminate their account and erase their data at any time from profile settings. EvenTime reserves the right to suspend accounts violating community safety standards.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
