"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildIndex, searchItems, type SearchItem } from "@/lib/search";
import { PROJECTS } from "@/lib/data/projects";
import { AppIcon } from "@/components/ui/AppIcon";
import { CrypticMark, IconDoc, IconGrid, IconSearch } from "@/components/ui/Icons";
import { useFocusTrap } from "./useFocusTrap";

const ACCENT = Object.fromEntries(PROJECTS.map((p) => [p.slug, p.accent]));

function ItemIcon({ item, size = 40 }: { item: SearchItem; size?: number }) {
  if (item.kind === "project") return <AppIcon name={item.title} accent={ACCENT[item.id]} size={size} />;
  return (
    <span className="grid shrink-0 place-items-center rounded-[30%] border border-line bg-white/[0.05] text-muted" style={{ width: size, height: size }} aria-hidden>
      {item.kind === "doc" ? <IconDoc size={size * 0.45} /> : <IconGrid size={size * 0.45} />}
    </span>
  );
}

// PolyOS style Start menu: search, pinned apps, and results you can arrow through.
export function StartMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <StartMenuPanel onClose={onClose} />;
}

function StartMenuPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const index = useMemo(() => buildIndex(), []);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const results = searchItems(index, query);
  useFocusTrap(panel, true, onClose);
  // after the trap has remembered who opened the menu
  useEffect(() => input.current?.focus(), []);

  const go = (item: SearchItem) => {
    onClose();
    if (item.href.startsWith("/#") && window.location.pathname === "/") {
      document.getElementById(item.href.slice(2))?.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", item.href);
    } else {
      router.push(item.href);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter" && results[cursor]) {
      e.preventDefault();
      go(results[cursor]);
    }
  };

  const pinnedView = query.trim() === "";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        id="start-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Start menu"
        className="menu-pop glass-strong fixed bottom-[88px] left-1/2 z-50 flex max-h-[min(72vh,600px)] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 flex-col overflow-hidden rounded-[24px]"
      >
        <div className="p-4 sm:p-5">
          <label className="flex items-center gap-3 rounded-full border border-accent/40 bg-white/[0.04] px-4 py-2.5 focus-within:border-accent">
            <IconSearch size={17} className="text-muted" />
            <span className="sr-only">Search projects, docs and sections</span>
            <input
              ref={input}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={onKey}
              placeholder="Search projects, docs and sections"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-faint"
              role="combobox"
              aria-expanded="true"
              aria-controls="start-results"
              aria-activedescendant={results[cursor] ? `start-${results[cursor].id}` : undefined}
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
          <p className="px-1 pb-2 text-sm font-semibold text-fg">{pinnedView ? "Pinned" : "Results"}</p>
          {results.length === 0 ? (
            <p className="px-1 py-6 text-sm text-muted">No results for “{query}”.</p>
          ) : (
            <ul
              id="start-results"
              role="listbox"
              aria-label="Results"
              className={pinnedView ? "grid grid-cols-3 gap-1 sm:grid-cols-4" : "flex flex-col gap-0.5"}
            >
              {results.map((item, i) => (
                <li key={item.id} id={`start-${item.id}`} role="option" aria-selected={i === cursor}>
                  <button
                    type="button"
                    onClick={() => go(item)}
                    onMouseEnter={() => setCursor(i)}
                    className={`press w-full rounded-2xl text-left ${i === cursor ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"} ${
                      pinnedView ? "flex flex-col items-center gap-2 px-2 py-3 text-center" : "flex items-center gap-3 px-3 py-2.5"
                    }`}
                  >
                    <ItemIcon item={item} size={pinnedView ? 44 : 36} />
                    <span className="min-w-0">
                      <span className={`block truncate text-fg ${pinnedView ? "text-[12.5px]" : "text-sm font-medium"}`}>{item.title}</span>
                      {!pinnedView && <span className="block truncate text-xs text-muted">{item.subtitle}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-5 py-3 text-xs text-muted">
          <CrypticMark size={18} />
          <span className="text-fg">Cryptic Inc.</span>
          <span className="ml-auto hidden sm:inline">↑ ↓ to move · Enter to open · Esc to close</span>
        </div>
      </div>
    </>
  );
}
