import { Window } from "@/components/ui/Window";
import { Decrypt } from "@/components/ui/Decrypt";
import { SECTIONS } from "@/lib/data/sections";

export default function Home() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-6 px-4 pt-10 sm:px-6">
      <Decrypt as="h1" text="Cryptic Inc." className="font-display text-6xl font-semibold" />
      {SECTIONS.map((s) => (
        <Window key={s.id} id={s.id} title={s.label}>
          <div className="h-[60vh]" />
        </Window>
      ))}
    </div>
  );
}
