import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AdminHeader() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <h2 className="font-['Outfit'] font-black text-[#6C47FF] text-xl tracking-tight">EvenTime Admin</h2>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>
      </div>
    </header>
  );
}