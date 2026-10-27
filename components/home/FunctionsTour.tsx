"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PROJECTS } from "@/lib/data/projects";
import { AppIcon } from "@/components/ui/AppIcon";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { Shot } from "@/components/ui/Shot";
import { frameUrl } from "@/lib/frame-url";

// A tab per project; inside, the functions list scrolls past a sticky screenshot that
// swaps to whichever function is in the middle of the screen (or clicked).
export function FunctionsTour() {
  const [tab, setTab] = useState(0);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const project = PROJECTS[tab];
  const feature = project.features[Math.min(active, project.features.length - 1)];

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [tab]);

  const choose = (i: number) => {
    setTab(i);
    setActive(0);
    tabs.current[i]?.focus();
  };

  const onTabKey = (e: React.KeyboardEvent) => {
    const n = PROJECTS.length;
    if (e.key === "ArrowRight") choose((tab + 1) % n);
    else if (e.key === "ArrowLeft") choose((tab - 1 + n) % n);
    else if (e.key === "Home") choose(0);
    else if (e.key === "End") choose(n - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <div role="tablist" aria-label="Projects" className="-mx-1 mb-8 flex gap-1 overflow-x-auto px-1 pb-1" onKeyDown={onTabKey}>
        {PROJECTS.map((p, i) => (
          <button
            key={p.slug}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            id={`fn-tab-${p.slug}`}
            aria-selected={i === tab}
            aria-controls={`fn-panel-${p.slug}`}
            tabIndex={i === tab ? 0 : -1}
            onClick={() => choose(i)}
            className={`press flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
              i === tab ? "border-line-strong bg-white/[0.08] text-fg" : "border-transparent text-muted hover:bg-white/[0.04] hover:text-fg"
            }`}
          >
            <AppIcon name={p.name} accent={p.accent} size={20} />
            {p.name}
          </button>
        ))}
      </div>

      <div id={`fn-panel-${project.slug}`} role="tabpanel" aria-labelledby={`fn-tab-${project.slug}`} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ol className="flex flex-col">
          {project.features.map((f, i) => (
            <li
              key={`${project.slug}-${f.title}`}
              ref={(el) => {
                items.current[i] = el;
              }}
              data-index={i}
              className="lg:py-[8vh]"
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`press w-full rounded-2xl border-l-2 px-4 py-3 text-left ${
                  i === active ? "border-[var(--fa)] bg-white/[0.04]" : "border-transparent hover:bg-white/[0.03]"
                }`}
                style={{ "--fa": project.accent } as React.CSSProperties}
                aria-current={i === active}
              >
                <span className="font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-1 block font-display text-lg font-semibold text-fg">{f.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{f.body}</span>
              </button>
              <div className="mt-3 lg:hidden">
                <BrowserFrame url={frameUrl(project)}>
                  <Shot src={f.image} alt={f.alt} sizes="100vw" />
                </BrowserFrame>
              </div>
            </li>
          ))}
        </ol>

        <div className="hidden lg:block">
          <div className="sticky top-[12vh]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={feature.image + project.slug}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              >
                <BrowserFrame url={frameUrl(project)}>
                  <Shot src={feature.image} alt={feature.alt} sizes="(min-width: 1024px) 600px, 100vw" />
                </BrowserFrame>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
