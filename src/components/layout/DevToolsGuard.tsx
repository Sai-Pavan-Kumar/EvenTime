"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

let adminCache: boolean | null = null; // remembers the answer for this browser tab session

export function DevToolsGuard() {
  const [isAdmin, setIsAdmin] = useState(adminCache ?? false);
  const [checked, setChecked] = useState(adminCache !== null);

  useEffect(() => {
    if (adminCache !== null) return; // already know the answer, skip the network call entirely

    const supabase = createClient();
    let mounted = true;

    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        adminCache = false;
        if (mounted) setChecked(true);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, user_type")
        .eq("id", user.id)
        .single();
      const result = profile?.role === "admin" || profile?.user_type === "admin";
      adminCache = result;
      if (mounted) {
        setIsAdmin(result);
        setChecked(true);
      }
    };
    checkAdmin();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!checked || isAdmin) return;

    const blockRightClick = (e: MouseEvent) => e.preventDefault();

    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (
        key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(key)) ||
        (e.metaKey && e.altKey && ["I", "J", "C"].includes(key)) ||
        (e.ctrlKey && key === "U")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", blockRightClick);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", blockRightClick);
      document.removeEventListener("keydown", blockKeys);
    };
  }, [checked, isAdmin]);

  return null;
}