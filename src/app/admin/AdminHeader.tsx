"use client";
import { Search, Bell, Command } from "lucide-react";
import { usePathname } from "next/navigation";

export function AdminHeader() {
  const pathname = usePathname();
  
  const pathParts = pathname.split('/').filter(p => p !== '');
  const currentPage = pathParts.length > 1 ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1) : 'Overview';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <span>Admin</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900">{currentPage}</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search events, users..." 
            className="w-64 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/20 focus:border-[#6C47FF] transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm">
            <Command className="w-3 h-3" /> K
          </div>
        </div>

        <button className="relative text-slate-500 hover:text-slate-900 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-slate-200 shadow-sm cursor-pointer"></div>
      </div>
    </header>
  );
}