"use client";

import { useEffect, useRef, useState } from "react";

type Cell = { date: string; count: number };

function level(count: number) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

const OPACITY = [0, 0.32, 0.55, 0.8, 1];

// A year of commits, one column per week. Cells fade in on a diagonal when it scrolls
// into view (only once JS is running, so the grid is never invisible without it).
export function Heatmap({ weeks, accent = "#7c8cff", label }: { weeks: Cell[][]; accent?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "armed" | "in">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth; // phones: start at the most recent weeks
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    const t = requestAnimationFrame(() => setState((s) => (s === "idle" ? "armed" : s)));
    return () => {
      io.disconnect();
      cancelAnimationFrame(t);
    };
  }, []);

  return (
    <div ref={ref} className="overflow-x-auto pb-2">
      <div role="img" aria-label={label} className={`heat ${state} flex w-max gap-[3px]`}>
        {weeks.map((week, w) => (
          <div key={week[0]?.date ?? w} className="flex flex-col gap-[3px]">
            {week.map((c, d) => (
              <span
                key={c.date}
                title={`${c.count} commit${c.count === 1 ? "" : "s"} on ${c.date}`}
                className="heat-cell block h-[11px] w-[11px] rounded-[3px]"
                style={
                  {
                    "--d": w + d,
                    background: c.count === 0 ? "rgb(255 255 255 / 0.05)" : `color-mix(in oklab, ${accent} ${OPACITY[level(c.count)] * 100}%, transparent)`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
