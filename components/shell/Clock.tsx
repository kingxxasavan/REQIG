"use client";

import { useSyncExternalStore } from "react";

const STEP = 15_000;
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, STEP);
  return () => clearInterval(id);
};
const getSnapshot = () => Math.floor(Date.now() / STEP);
const getServerSnapshot = () => null;

// The server renders nothing, so its time never mismatches the visitor's; the client
// fills in after hydration and ticks every 15 seconds.
export function Clock() {
  const tick = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (tick === null) return <span className="w-[72px]" aria-hidden />;
  const now = new Date(tick * STEP);
  return (
    <time dateTime={now.toISOString()} className="flex flex-col items-end leading-tight tabular-nums">
      <span className="text-[13px] font-medium text-fg">{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
      <span className="hidden text-[11px] text-muted sm:block">{now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
    </time>
  );
}
