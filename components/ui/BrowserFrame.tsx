import type { ReactNode } from "react";

export function BrowserFrame({ url, children, className = "" }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[14px] border border-line-strong bg-[#0b0a12] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.9)] ${className}`}>
      <div className="flex items-center gap-2 border-b border-line bg-white/[0.03] px-3 py-2" aria-hidden>
        <span className="flex gap-1.5">
          <i className="h-2 w-2 rounded-full bg-white/15" />
          <i className="h-2 w-2 rounded-full bg-white/15" />
          <i className="h-2 w-2 rounded-full bg-white/15" />
        </span>
        <span className="mx-auto max-w-[70%] truncate rounded-md bg-white/[0.05] px-3 py-0.5 font-mono text-[10.5px] text-faint">{url}</span>
      </div>
      {children}
    </div>
  );
}
