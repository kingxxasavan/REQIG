"use client";

import { useEffect, useRef, useState, type ElementType } from "react";
import { scrambleFrame } from "@/lib/decrypt";

const DURATION = 900;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Text that scrambles through glyphs and resolves left to right the first time it is
// seen. The real text is always in the DOM (server render, aria-label, and an invisible
// copy that reserves the width), so nothing shifts and screen readers never hear glyphs.
export function Decrypt({
  text,
  as: Tag = "span",
  className = "",
  hoverReplay = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  hoverReplay?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(text);
  const frame = useRef(0);

  const play = () => {
    if (prefersReducedMotion()) return;
    cancelAnimationFrame(frame.current);
    const start = performance.now();
    const tick = (now: number) => {
      const p = (now - start) / DURATION;
      setShown(scrambleFrame(text, p, Math.random));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame.current);
    };
    // play reads the latest text; we only want to observe once per text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <Tag ref={ref} className={className} aria-label={text} onMouseEnter={hoverReplay ? play : undefined}>
      <span aria-hidden className="relative inline-block max-w-full">
        <span className="invisible">{text}</span>
        <span className="absolute inset-0">{shown}</span>
      </span>
    </Tag>
  );
}
