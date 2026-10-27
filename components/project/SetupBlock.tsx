import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { IconArrow, IconDownload, IconGithub, IconLock } from "@/components/ui/Icons";

export function SetupBlock({ project: p }: { project: Project }) {
  if (p.source.visibility === "private" || !p.setupSummary) {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-line bg-white/[0.03] p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-muted" aria-hidden>
          <IconLock />
        </span>
        <div>
          <p className="font-medium text-fg">Source is private</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {p.name} isn&apos;t open source, so there is no public repo or setup guide. The build story above shows how it was made.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <ol className="flex flex-col gap-3">
        {p.setupSummary.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-strong font-mono text-xs text-accent">{i + 1}</span>
            <p className="pt-0.5 text-sm leading-relaxed text-muted">{step}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href={`/docs/${p.slug}-setup`} variant="primary">
          Read the setup guide <IconArrow size={16} />
        </Button>
        <Button href={`/downloads/${p.slug}-setup.md`} download>
          <IconDownload size={16} /> Download .md
        </Button>
        <Button href={p.source.url} variant="ghost">
          <IconGithub size={16} /> GitHub
        </Button>
      </div>
    </div>
  );
}
