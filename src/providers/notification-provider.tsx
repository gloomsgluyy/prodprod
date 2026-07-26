"use client";

import { useEffect, useState } from "react";
import type { NotifyType } from "@/lib/notify";

type Toast = { id: number; message: string; type: NotifyType };

export function NotificationProvider() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    function onNotify(e: Event) {
      const detail = (e as CustomEvent<{ message: string; type?: NotifyType }>).detail;
      if (!detail?.message) return;
      const item = { id: Date.now(), message: detail.message, type: detail.type ?? "success" };
      setItems((prev) => [...prev.slice(-2), item]);
      window.setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== item.id)), 3500);
    }
    window.addEventListener("app-notify", onNotify);
    return () => window.removeEventListener("app-notify", onNotify);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`notify notify--${item.type}`}>
          {item.message}
        </div>
      ))}
    </div>
  );
}
