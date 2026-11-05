"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function MobileSignOutButton() {
  const router = useRouter();
  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleSignOut} 
      className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50"
    >
      <LogOut className="h-[18px] w-[18px] shrink-0" /> Sign out
    </button>
  );
}