import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | EvenTime",
  description: "Privacy policy and data handling practices for EvenTime.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F7] pb-24">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-200/60">
          <h1 className="text-4xl font-heading font-black text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-500 font-medium mb-10">Last updated: June 30, 2026</p>
          
          <div className="space-y-8 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
              <p>
                When you sign up for EvenTime, we collect your email address and basic profile details (like your username and location preferences). This helps us personalize your event feed and verify your identity securely.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Data</h2>
              <p>
                We use your data strictly to improve your experience on our platform. This includes showing you events in your city, recommending categories you care about, and keeping your account secure.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Security (DPDP Compliant)</h2>
              <p>
                We value your privacy. Your passwords are encrypted using secure hashing algorithms, and we do not sell your personal data to third parties. You have the full right to request account deletion and data erasure at any time from your settings page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Contact Us</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy, please contact us at  eventime.admin@gmail.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}