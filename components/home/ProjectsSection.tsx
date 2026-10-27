import { PROJECTS } from "@/lib/data/projects";
import { Window } from "@/components/ui/Window";
import { Reveal } from "@/components/ui/Reveal";
import { Decrypt } from "@/components/ui/Decrypt";
import { IconGrid } from "@/components/ui/Icons";
import { ProjectCard } from "./ProjectCard";

export function ProjectsSection() {
  return (
    <Reveal>
      <Window id="projects" title="Projects" icon={<IconGrid />}>
        <div className="mb-8 max-w-2xl">
          <Decrypt as="p" text="Six things we shipped." className="font-display text-3xl font-semibold tracking-[-0.02em] text-fg sm:text-4xl" />
          <p className="mt-3 text-muted">Websites, an assistant, an operating system and two stores. Open any of them for screenshots, the build story and how to run it.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06} className="h-full">
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
      </Window>
    </Reveal>
  );
}
