"use client";

import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/components/shell/useFocusTrap";
import { IconChevron, IconClose } from "./Icons";
import { Shot } from "./Shot";

// Full size screenshot viewer: Escape closes, arrow keys move, focus goes back to the
// thumbnail that opened it.
export function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: { src: string; alt: string; caption?: string }[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useFocusTrap(panel, true, onClose);
  const n = images.length;
  const img = images[index];

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % n);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [index, n, onIndex]);

  return (
    <div ref={panel} role="dialog" aria-modal="true" aria-label={img.alt} className="fixed inset-0 z-[70] flex flex-col bg-black/85 p-3 sm:p-8" onClick={onClose}>
      <div className="flex items-center gap-3 pb-3 text-sm text-muted" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-xs">
          {index + 1} / {n}
        </span>
        <span className="truncate text-fg">{img.caption}</span>
        <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="press ml-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 text-fg hover:bg-white/20">
          <IconClose />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="max-h-full w-full max-w-6xl overflow-auto rounded-xl" onClick={(e) => e.stopPropagation()}>
          <Shot src={img.src} alt={img.alt} sizes="100vw" />
        </div>
        {n > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous screenshot"
              onClick={(e) => {
                e.stopPropagation();
                onIndex((index - 1 + n) % n);
              }}
              className="press absolute left-1 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-fg hover:bg-black/80 sm:left-3"
            >
              <IconChevron className="rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next screenshot"
              onClick={(e) => {
                e.stopPropagation();
                onIndex((index + 1) % n);
              }}
              className="press absolute right-1 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-fg hover:bg-black/80 sm:right-3"
            >
              <IconChevron />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
