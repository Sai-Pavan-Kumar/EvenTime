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
    <aside className="w-[280px] bg-[#0A0A0B] border-r border-[#1F1F22] hidden lg:flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-[#1F1F22] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C47FF] to-[#9D84FF] flex items-center justify-center shadow-[0_0_15px_rgba(108,71,255,0.4)]">
            <span className="text-white font-black text-sm">ET</span>
          </div>
          <h2 className="font-['Outfit'] font-bold text-white text-lg tracking-wide">EvenTime <span className="text-[#6C47FF]">OS</span></h2>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 overflow-y-auto space-y-8">
        <div>
          <p className="px-3 text-xs font-bold text-[#808086] uppercase tracking-[0.15em] mb-3">Main Menu</p>
          <nav className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                    isActive 
                      ? "bg-[#1F1F22] text-white shadow-sm border border-[#27272A]" 
                      : "text-[#A0A0AB] hover:bg-[#18181B] hover:text-white border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#6C47FF]" : "text-[#808086]"}`} /> 
                  <span className="text-sm">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-[#1F1F22] shrink-0">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[#A0A0AB] hover:bg-[#18181B] hover:text-white transition-all border border-transparent hover:border-[#27272A]">
          <Settings className="w-4 h-4 text-[#808086]" />
          <span className="text-sm">Exit Admin Mode</span>
        </Link>
      </div>
    </aside>
  );
}