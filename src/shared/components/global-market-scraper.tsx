"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const LAST_KEY = "coaltrade:lastMarketScrapeTime";
const INTERVAL_KEY = "coaltrade:marketScrapeIntervalMs";

export function GlobalMarketScraper() {
  const { data: session, status } = useSession();
  const running = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !["ADMIN_MARKETING", "CEO", "DIRUT", "ASS_DIRUT"].includes(session?.user?.role ?? "")) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const scrape = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const res = await fetch("/api/market-scrape", { method: "POST" });
        if (res.ok) localStorage.setItem(LAST_KEY, String(Date.now()));
      } finally {
        running.current = false;
      }
    };

    const schedule = () => {
      const interval = Number(localStorage.getItem(INTERVAL_KEY)) || DEFAULT_INTERVAL_MS;
      const last = Number(localStorage.getItem(LAST_KEY)) || 0;
      const delay = Math.max(1000, interval - (Date.now() - last));
      timeout = setTimeout(async () => { await scrape(); schedule(); }, delay);
    };

    schedule();
    window.addEventListener("marketScrapeIntervalChanged", schedule);
    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener("marketScrapeIntervalChanged", schedule);
    };
  }, [session?.user?.role, status]);

  return null;
}
