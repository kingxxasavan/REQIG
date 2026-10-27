"use client";

import { useCallback, useState } from "react";
import type { Feature } from "@/lib/types";
import { Lightbox } from "@/components/ui/Lightbox";
import { Shot } from "@/components/ui/Shot";

// Every function with its screenshot; clicking a screenshot opens it full size.
export function Gallery({ features, accent }: { features: Feature[]; accent: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const images = features.map((f) => ({ src: f.image, alt: f.alt, caption: f.title }));

  return (
    <>
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {features.map((f, i) => (
          <li key={f.title} className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-white/[0.03]">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block overflow-hidden border-b border-line"
              aria-label={`Open screenshot: ${f.title}`}
            >
              <Shot src={f.image} alt={f.alt} sizes="(min-width: 768px) 540px, 100vw" className="transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.02]" />
              <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[11px] text-fg opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                View full size
              </span>
            </button>
            <div className="p-5">
              <p className="font-mono text-[11px]" style={{ color: accent }}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-fg">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox images={images} index={open} onClose={close} onIndex={setOpen} />}
    </>
  );
}
