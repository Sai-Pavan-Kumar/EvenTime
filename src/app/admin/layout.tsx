import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
import { LayoutDashboard, Users, CalendarDays, ShieldAlert, MessageSquareWarning, Building2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <Navbar />
      <div className="flex flex-1 max-w-[1600px] w-full mx-auto">
        {/* SaaS Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white pt-8 px-4 h-[calc(100vh-64px)] sticky top-16 shrink-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Admin Menu</p>
          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-[#6C47FF] hover:bg-[#6C47FF]/10 font-bold transition-all"><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
            <Link href="/admin/events" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 font-bold transition-all"><CalendarDays className="w-5 h-5" /> Events</Link>
            <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold transition-all"><Users className="w-5 h-5" /> Users</Link>
            <Link href="/admin/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 font-bold transition-all"><ShieldAlert className="w-5 h-5" /> Reports</Link>
            <Link href="/admin/feedback" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 font-bold transition-all"><MessageSquareWarning className="w-5 h-5" /> Feedback</Link>
            <Link href="/admin/colleges" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-purple-600 hover:bg-purple-50 font-bold transition-all"><Building2 className="w-5 h-5" /> Colleges</Link>
          </nav>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 w-full p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}