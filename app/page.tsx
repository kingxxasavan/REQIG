import { Hero } from "@/components/home/Hero";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { FunctionsTour } from "@/components/home/FunctionsTour";
import { PlaybookSection } from "@/components/home/PlaybookSection";
import { ContributionsSection } from "@/components/home/ContributionsSection";
import { FutureSection } from "@/components/home/FutureSection";
import { Footer } from "@/components/home/Footer";
import { Window } from "@/components/ui/Window";
import { Reveal } from "@/components/ui/Reveal";
import { Decrypt } from "@/components/ui/Decrypt";
import { IconLayers } from "@/components/ui/Icons";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-3 sm:px-6">
        <ProjectsSection />
        <Reveal>
          <Window id="functions" title="Functions" icon={<IconLayers />}>
            <Decrypt as="p" text="What's inside each one." className="font-display text-3xl font-semibold tracking-[-0.02em] text-fg sm:text-4xl" />
            <p className="mb-8 mt-3 max-w-2xl text-muted">Pick a project, then scroll through its main features with the real screens.</p>
            <FunctionsTour />
          </Window>
        </Reveal>
        <PlaybookSection />
        <ContributionsSection />
        <FutureSection />
        <Footer />
      </div>
    </>
  );
}
