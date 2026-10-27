"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SECTIONS } from "@/lib/data/sections";
import type { Section } from "@/lib/types";
import { CrypticMark, IconDoc, IconGrid, IconLayers, IconPulse, IconRocket, IconSpark } from "@/components/ui/Icons";
import { Clock } from "./Clock";
import { DocsMenu } from "./DocsMenu";
import { StartMenu } from "./StartMenu";
import { useActiveSection } from "./useActiveSection";

const ICONS: Record<Section["id"], ReactNode> = {
  projects: <IconGrid />,
  functions: <IconLayers />,
  playbook: <IconSpark />,
  contributions: <IconPulse />,
  future: <IconRocket />,
};

const IDS = SECTIONS.map((s) => s.id);

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

function TaskbarButton({ label, active, children }: { label: string; active: boolean; children: ReactNode }) {
  return (
    <span className="taskbar-btn relative flex h-11 items-center gap-2 rounded-xl px-2.5 text-muted transition-colors group-hover:text-fg lg:px-3">
      <span className="taskbar-icon">{children}</span>
      <span className="hidden text-[13px] lg:inline">{label}</span>
      {active && <motion.span layoutId="taskbar-dot" className="absolute bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-accent" />}
    </span>
  );
}

// The floating PolyOS style taskbar: mark (start menu), a button per section, the Docs
// menu, and a clock.
export function Taskbar() {
  const pathname = usePathname();
  const home = pathname === "/";
  const reduce = useReducedMotion();
  const [startOpen, setStartOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const docsBtn = useRef<HTMLButtonElement>(null);
  const active = useActiveSection(IDS, home);
  const closeStart = useCallback(() => setStartOpen(false), []);
  const closeDocs = useCallback(() => setDocsOpen(false), []);

  // close the menus whenever the page changes (back/forward included)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setStartOpen(false);
    setDocsOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setDocsOpen(false);
        setStartOpen((o) => !o);
      } else if (e.key === "/" && !isTyping(e.target)) {
        e.preventDefault();
        setDocsOpen(false);
        setStartOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <nav aria-label="Taskbar" className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-[1180px]">
        <div className="glass-strong flex h-[60px] items-center gap-1 rounded-[18px] px-1.5 sm:px-2">
          <button
            type="button"
            onClick={() => {
              setDocsOpen(false);
              setStartOpen((o) => !o);
            }}
            aria-label="Open the start menu"
            aria-expanded={startOpen}
            aria-controls="start-menu"
            title="Start (Ctrl K)"
            className={`press grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-white/[0.08] ${startOpen ? "bg-white/[0.1]" : ""}`}
          >
            <CrypticMark size={24} />
          </button>

          <ul className="mx-auto flex items-center">
            {SECTIONS.map((s, i) => (
              <li key={s.id} className="flex items-center">
                {home ? (
                  <button type="button" onClick={() => scrollTo(s.id)} className="group press rounded-xl hover:bg-white/[0.06]" aria-label={s.label} title={s.label}>
                    <TaskbarButton label={s.label} active={active === s.id}>
                      {ICONS[s.id]}
                    </TaskbarButton>
                  </button>
                ) : (
                  <Link href={`/#${s.id}`} className="group press rounded-xl hover:bg-white/[0.06]" aria-label={s.label} title={s.label}>
                    <TaskbarButton label={s.label} active={false}>
                      {ICONS[s.id]}
                    </TaskbarButton>
                  </Link>
                )}
                {i === 2 && (
                  <button
                    ref={docsBtn}
                    type="button"
                    onClick={() => {
                      setStartOpen(false);
                      setDocsOpen((o) => !o);
                    }}
                    aria-label="Docs"
                    title="Docs"
                    aria-expanded={docsOpen}
                    aria-controls="docs-menu"
                    className={`group press rounded-xl hover:bg-white/[0.06] ${docsOpen || pathname.startsWith("/docs") ? "bg-white/[0.08]" : ""}`}
                  >
                    <TaskbarButton label="Docs" active={false}>
                      <IconDoc />
                    </TaskbarButton>
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="shrink-0 pr-2">
            <Clock />
          </div>
        </div>
      </nav>
      <DocsMenu open={docsOpen} onClose={closeDocs} anchor={docsBtn} />
      <StartMenu open={startOpen} onClose={closeStart} />
    </>
  );
}
