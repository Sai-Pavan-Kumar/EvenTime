"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function MobileSignOutButton() {
  const router = useRouter();
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleSignOut} 
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-all w-full text-left"
    >
      <LogOut className="w-4 h-4" /> Sign Out
    </button>
  );
}