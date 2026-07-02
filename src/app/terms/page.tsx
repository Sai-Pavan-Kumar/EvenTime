import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | EvenTime",
  description: "Terms of service and user agreements for EvenTime.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#F5F5F7] pb-24">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-200/60">
          <h1 className="text-4xl font-heading font-black text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-500 font-medium mb-10">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-8 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using EvenTime ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. User Accounts</h2>
              <p>
                To access certain features, you must register for an account. You agree to provide accurate information and are solely responsible for maintaining the confidentiality of your account credentials. We reserve the right to suspend or terminate accounts that violate our policies.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. User Conduct and Content</h2>
              <p>
                You agree not to use the Platform for any unlawful purpose. When submitting events or content, you ensure that you have the right to share such information and that it does not infringe on any third-party rights or contain malicious intent. EvenTime reserves the right to remove any content that violates these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Intellectual Property</h2>
              <p>
                The Platform, including its original content, features, and functionality, are owned by EvenTime and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Disclaimer of Warranties</h2>
              <p>
                EvenTime serves as a discovery platform. We do not guarantee the accuracy, quality, or safety of any events listed by third parties. Your attendance at any event is solely at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Contact Information</h2>
              <p>
                For any questions regarding these Terms of Service, please contact us at  eventime.admin@gmail.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}