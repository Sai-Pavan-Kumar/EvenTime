import { Metadata } from "next";
import { Users, Target } from "lucide-react";
export const metadata: Metadata = {
  title: "About Us | EvenTime",
  description: "Learn more about EvenTime and our mission.",
};
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-surface-base pt-24 pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100">
          <h1 className="text-4xl md:text-5xl font-heading font-black text-slate-900 mb-6 tracking-tight">
            About EvenTime
          </h1>
          <p className="text-lg text-slate-600 font-medium mb-12 leading-relaxed max-w-2xl">
            We built EvenTime to fix a simple problem: finding good tech events, startup meetups, and professional workshops is too chaotic. Our mission is to be the cleanest, most reliable directory for your career growth.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mt-12 border-t border-slate-100 pt-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Our Mission</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                To connect ambitious individuals with the right opportunities. We filter the noise so you can focus on attending events that actually matter to your career.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Community First</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                EvenTime is built for the community. Whether you are a student, a founder, or a professional, our platform adapts to show what's relevant to you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}