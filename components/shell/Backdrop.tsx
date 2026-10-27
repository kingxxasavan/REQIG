"use client";

import { useEffect, useRef } from "react";

// Fixed crystal backdrop with a dark veil, two drifting aurora glows and a soft
// spotlight that follows the pointer (fine pointers only, off with reduced motion).
export function Backdrop() {
  const spot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || still) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        spot.current?.style.setProperty("--mx", `${e.clientX}px`);
        spot.current?.style.setProperty("--my", `${e.clientY}px`);
        spot.current?.style.setProperty("opacity", "1");
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="backdrop-image absolute inset-0" />
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div ref={spot} className="spotlight absolute inset-0 opacity-0 transition-opacity duration-700" />
      <div className="backdrop-veil absolute inset-0" />
    </div>
  );
}
