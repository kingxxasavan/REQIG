"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { DOCS, type DocGroup } from "@/lib/data/docs";
import { IconDownload } from "@/components/ui/Icons";
import { useFocusTrap } from "./useFocusTrap";

const GROUPS: { id: DocGroup; label: string }[] = [
  { id: "setup", label: "Setup guides" },
  { id: "ai", label: "Built with AI" },
];

// The taskbar's Docs popup: every guide, each with Read and Download.
export function DocsMenu({ open, onClose, anchor }: { open: boolean; onClose: () => void; anchor: React.RefObject<HTMLElement | null> }) {
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, open, onClose);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !anchor.current?.contains(t)) onClose();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onClose, anchor]);

  if (!open) return null;
  return (
    <div
      ref={panel}
      id="docs-menu"
      role="dialog"
      aria-label="Docs"
      className="menu-pop glass-strong fixed bottom-[88px] left-1/2 z-50 flex max-h-[min(70vh,560px)] w-[min(440px,calc(100vw-24px))] -translate-x-1/2 flex-col overflow-hidden rounded-[20px]"
    >
      <div className="overflow-y-auto p-3">
        {GROUPS.map((g) => (
          <div key={g.id} className="mb-2 last:mb-0">
            <p className="px-2 pb-1.5 pt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{g.label}</p>
            <ul>
              {DOCS.filter((d) => d.group === g.id).map((d) => (
                <li key={d.slug} className="flex items-center gap-1 rounded-xl hover:bg-white/[0.05]">
                  <Link href={`/docs/${d.slug}`} onClick={onClose} className="min-w-0 flex-1 truncate rounded-xl px-2 py-2 text-sm text-fg">
                    {d.title}
                  </Link>
                  <a
                    href={`/downloads/${d.slug}.md`}
                    download
                    className="press grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-white/[0.08] hover:text-fg"
                    aria-label={`Download ${d.title} as markdown`}
                  >
                    <IconDownload size={16} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Link href="/docs" onClick={onClose} className="border-t border-line px-5 py-3 text-sm text-accent hover:bg-white/[0.04]">
        All docs
      </Link>
    </div>
  );
}
