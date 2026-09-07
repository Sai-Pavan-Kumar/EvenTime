import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | EvenTime",
  description: "Privacy & Data Protection Policy for EvenTime under DPDP Act 2023.",
};

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>DPDP Act 2023 Compliant</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 mb-2">
            Privacy & Data Protection Policy
          </h1>
          <p className="text-slate-400 font-medium text-sm mb-8">Last updated: June 30, 2026</p>

          <div className="h-px bg-slate-100 mb-8" />

          <div className="space-y-8 text-slate-700 leading-relaxed text-[15px]">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
              <p className="text-slate-600">
                When you create an account on EvenTime, we collect your email address, username, preferred cities, and event category interests. If you choose a student profile, we also collect your college and graduation year to provide personalized campus fests and hackathon updates.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">2. Purpose of Data Processing</h2>
              <p className="text-slate-600">
                In strict accordance with the Digital Personal Data Protection (DPDP) Act, your data is processed solely for specified, lawful purposes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                <li>Customizing your "For You" and "Around You" event feeds.</li>
                <li>Secure authentication via encrypted session tokens.</li>
                <li>Calculating your ET Score and Curator Leaderboard achievements.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">3. Data Security & Storage</h2>
              <p className="text-slate-600">
                We never sell, rent, or monetize your personal information to third-party data brokers or advertisers. All database transactions are protected with strict Row Level Security (RLS) policies and industry-standard SSL encryption.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">4. Your Rights as a Data Principal</h2>
              <p className="text-slate-600">
                Under the DPDP Act 2023, you have the right to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                <li>Access and summary of all your personal data stored on EvenTime.</li>
                <li>Correction, completion, and updating of your profile details.</li>
                <li>Erasure and complete deletion of your account and personal data at any time via Profile Settings.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">5. Grievance Redressal & Contact</h2>
              <p className="text-slate-600">
                If you have any questions, privacy concerns, or data erasure requests, please contact our Data Grievance Officer:
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-brand-primary font-bold text-sm mt-2">
                <Mail className="w-4 h-4" />
                <span>eventime.admin@gmail.com</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
