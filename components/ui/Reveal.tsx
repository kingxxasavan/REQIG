"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// The "window opening" entrance: scale 0.96 to 1, a fade and a 12px rise, once.
// Content is visible in the server HTML (no JS, slow JS and reduced motion all just
// show it). Once running, anything still below the fold is hidden and animates in as
// soon as any part of it scrolls into view, however tall it is.
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"shown" | "armed" | "in">("shown");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // already on screen: leave it be
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setState("in");
        io.disconnect();
      }
    });
    const frame = requestAnimationFrame(() => {
      setState((s) => (s === "shown" ? "armed" : s));
      io.observe(el);
    });
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={`reveal ${state} ${className}`} style={delay ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties) : undefined}>
      {children}
    </div>
  );
}
