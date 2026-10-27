"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/toc";

function useCurrentHeading(ids: string[]) {
  const [current, setCurrent] = useState<string | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    const els = key
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: "0px 0px -75% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
  return current;
}

function Links({ toc, current }: { toc: TocEntry[]; current: string | null }) {
  return (
    <ul className="flex flex-col gap-0.5 text-sm">
      {toc.map((t) => (
        <li key={t.id}>
          <a
            href={`#${t.id}`}
            aria-current={current === t.id ? "location" : undefined}
            className={`block rounded-lg py-1.5 pr-2 leading-snug transition-colors ${t.depth === 3 ? "pl-6 text-[13px]" : "pl-3"} ${
              current === t.id ? "bg-white/[0.06] text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {t.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

// Sticky contents on wide screens, a collapsible list above the doc on narrow ones.
export function Toc({ toc }: { toc: TocEntry[] }) {
  const current = useCurrentHeading(toc.map((t) => t.id));
  if (toc.length === 0) return null;
  return (
    <>
      <details className="rounded-2xl border border-line bg-white/[0.03] px-4 py-3 lg:hidden">
        <summary className="cursor-pointer text-sm font-medium text-fg">On this page</summary>
        <nav aria-label="On this page" className="mt-3">
          <Links toc={toc} current={current} />
        </nav>
      </details>
      <nav aria-label="Contents" className="sticky top-6 hidden max-h-[calc(100vh-130px)] overflow-y-auto lg:block">
        <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">On this page</p>
        <Links toc={toc} current={current} />
      </nav>
    </>
  );
}
