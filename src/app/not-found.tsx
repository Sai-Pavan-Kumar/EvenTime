import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Building2, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface-base flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-900/5">
          {/* Badge */}
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-[#6C47FF] text-xs font-black font-['Outfit'] uppercase tracking-wider">
            404 • Not Found
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-slate-900 tracking-tight">
              Not in our directory
            </h1>
            <p className="text-sm font-medium font-['Switzer',sans-serif] text-slate-500 leading-relaxed">
              The city, category, or event you requested does not exist in our active directory or may have moved.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-brand-primary text-white font-bold font-['Outfit'] text-sm hover:bg-[#5835E5] transition-all shadow-md shadow-brand-primary/20 active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <Link
              href="/cities"
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-slate-100 text-slate-700 font-bold font-['Outfit'] text-sm hover:bg-slate-200 transition-all active:scale-95"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Explore Cities</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-primary transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Looking for something specific? Search EvenTime →</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
