"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function DevToolsGuard() {
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || isAdmin) return;

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
  }, [isLoading, isAdmin]);

  return null;
}