import { LINKS } from "@/lib/data/links";
import { STATS_DAY } from "@/lib/site-stats";
import { CrypticMark } from "@/components/ui/Icons";

export function Footer() {
  return (
    <footer className="mt-6 flex w-full flex-col gap-6 rounded-[20px] border border-line bg-white/[0.02] px-6 py-8 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <CrypticMark size={30} />
        <div>
          <p className="font-display font-semibold text-fg">Cryptic Inc.</p>
          <p className="text-sm text-muted">We build software with AI and show exactly how.</p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2 sm:ml-auto">
        {LINKS.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer" className="press inline-flex rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:border-line-strong hover:text-fg">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Presented by Cryptic Inc. · {STATS_DAY.slice(0, 4)}</p>
    </footer>
  );
}
