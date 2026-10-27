import type { ReactNode } from "react";
import { IconLock } from "./Icons";

type Tone = "live" | "private" | "neutral";

export function Chip({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] tracking-wide ${
        tone === "live" ? "border-ok/30 bg-ok/10 text-ok" : tone === "private" ? "border-line-strong bg-white/[0.04] text-muted" : "border-line bg-white/[0.03] text-muted"
      } ${className}`}
    >
      {tone === "live" && <span className="live-dot" aria-hidden />}
      {tone === "private" && <IconLock size={12} />}
      {children}
    </span>
  );
}
