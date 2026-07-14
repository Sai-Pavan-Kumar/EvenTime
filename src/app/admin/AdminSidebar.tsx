"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays, ShieldAlert, MessageSquareWarning, Building2, Settings } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Events Queue", href: "/admin/events", icon: CalendarDays },
    { name: "User Directory", href: "/admin/users", icon: Users },
    { name: "Colleges", href: "/admin/colleges", icon: Building2 },
    { name: "Moderation", href: "/admin/reports", icon: ShieldAlert },
    { name: "Feedback", href: "/admin/feedback", icon: MessageSquareWarning },
  ];

  return (
    <aside className="w-[300px] bg-surface-base hidden lg:flex flex-col h-full shrink-0 p-6 pr-0">
      <div className="bg-[#FFFFFF] rounded-[32px] flex flex-col h-full shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* LOGO AREA */}
        <div className="h-[96px] flex items-center px-8 border-b border-black/[0.04] shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-[12px] bg-brand-primary flex items-center justify-center group-hover:bg-[#8B6FFF] transition-colors">
              <span className="text-white font-black font-['Outfit'] text-[16px]">ET</span>
            </div>
            <h2 className="font-['Outfit'] font-bold text-[#0D0D1A] text-[20px] tracking-tight">EvenTime <span className="text-brand-primary">OS</span></h2>
          </Link>
        </div>
        
        {/* MENU */}
        <div className="flex-1 py-8 px-6 overflow-y-auto space-y-8">
          <div>
            <p className="px-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.2em] mb-4 font-['Outfit']">Main Menu</p>
            <nav className="space-y-2">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-full font-semibold font-['Switzer'] transition-all duration-200 ${
                      isActive 
                        ? "bg-[#EDE8FF] text-brand-primary" 
                        : "text-[#555570] hover:bg-surface-base hover:text-[#0D0D1A]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-brand-primary" : "text-[#6B7280]"}`} /> 
                    <span className="text-[15px]">{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-black/[0.04] shrink-0">
          <Link href="/" className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-full font-semibold font-['Switzer'] text-[#555570] hover:bg-surface-base hover:text-[#0D0D1A] transition-colors">
            <Settings className="w-4 h-4 text-[#6B7280]" />
            <span className="text-[15px]">Exit Admin Mode</span>
          </Link>
        </div>

      </div>
    </aside>
  );
}