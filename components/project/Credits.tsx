import type { Credit } from "@/lib/types";
import { IconExternal, IconHeart } from "@/components/ui/Icons";

export function Credits({ credits, accent }: { credits: Credit[]; accent: string }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {credits.map((c, i) => (
        <li key={c.name} className="rounded-[18px] border border-line bg-white/[0.03] p-5" style={i === 0 ? { borderColor: `color-mix(in oklab, ${accent} 40%, transparent)` } : undefined}>
          <div className="flex items-center gap-2">
            {i === 0 && <IconHeart size={16} style={{ color: accent }} />}
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{c.role}</p>
          </div>
          <p className="mt-2 font-display text-xl font-semibold text-fg">{c.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
          {c.url && (
            <a href={c.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
              {c.url.replace(/^https:\/\//, "").replace(/\/$/, "")} <IconExternal size={14} />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
