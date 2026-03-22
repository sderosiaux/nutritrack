"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerRegister — registers /public/sw.js on mount.
 * Client-only component, renders nothing.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[sw] Registered, scope:", reg.scope);
      })
      .catch((err) => {
        console.error("[sw] Registration failed:", err);
      });
  }, []);

  return null;
}
