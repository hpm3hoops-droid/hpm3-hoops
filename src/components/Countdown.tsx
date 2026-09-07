"use client";
import { useEffect, useState } from "react";

export default function Countdown({ target, daysOnly }: { target: string; daysOnly?: boolean }) {
  const [t, setT] = useState<{ d: number; h: number; m: number } | null>(null);
  useEffect(() => {
    const tgt = new Date(target).getTime();
    const tick = () => {
      const ms = Math.max(0, tgt - Date.now());
      setT({ d: Math.floor(ms / 864e5), h: Math.floor((ms % 864e5) / 36e5), m: Math.floor((ms % 36e5) / 6e4) });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [target]);
  if (daysOnly) return <span className="mono">{t ? t.d : "—"}</span>;
  return (
    <div className="count">
      <div><b>{t ? t.d : "—"}</b><small>days</small></div>
      <div><b>{t ? String(t.h).padStart(2, "0") : "—"}</b><small>hours</small></div>
      <div><b>{t ? String(t.m).padStart(2, "0") : "—"}</b><small>min</small></div>
    </div>
  );
}
