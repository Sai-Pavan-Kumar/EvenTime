"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays, ShieldAlert, MessageSquareWarning, Building2 } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, color: "text-[#6C47FF]", bg: "bg-[#6C47FF]/10" },
    { name: "Events", href: "/admin/events", icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Users", href: "/admin/users", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Reports", href: "/admin/reports", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
    { name: "Feedback", href: "/admin/feedback", icon: MessageSquareWarning, color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Colleges", href: "/admin/colleges", icon: Building2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[260px] border-r border-slate-200 bg-white pt-8 px-4 h-[calc(100vh-64px)] sticky top-16 shrink-0">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Admin Menu</p>
      <nav className="space-y-1.5">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all ${
                isActive 
                  ? `${link.color} ${link.bg}` 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-5 h-5" /> {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}