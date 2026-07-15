"use client";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";

export function AdminHeader() {
  const pathname = usePathname();
  
  const pathParts = pathname.split('/').filter(p => p !== '');
  const currentPage = pathParts.length > 1 ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1) : 'Overview';

  return (
    <header className="h-[112px] flex items-center justify-between px-10 shrink-0 pt-6">
      <div className="flex items-center gap-2 text-[15px] font-bold font-['Switzer'] text-[#555570]">
        <span>Admin</span>
        <span className="text-[#6B7280]">/</span>
        <span className="text-[#0D0D1A]">{currentPage}</span>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative text-[#6B7280] hover:text-[#0D0D1A] transition-colors p-2.5 hover:bg-[#FFFFFF] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-transparent">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-[#F5F5F7]"></span>
        </button>
        
        <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] cursor-pointer text-white font-['Outfit'] font-bold text-[14px]">
          ET
        </div>
      </div>
    </header>
  );
}