import { Window } from "@/components/ui/Window";
import { Button } from "@/components/ui/Button";
import { IconArrow, IconClose } from "@/components/ui/Icons";

export default function NotFound() {
  return (
    <div className="grid min-h-[80svh] place-items-center px-4">
      <Window title="Not responding" icon={<IconClose />} className="w-full max-w-md" bodyClassName="p-6 sm:p-8">
        <p className="font-display text-2xl font-semibold text-fg">Not responding</p>
        <p className="mt-2 text-muted">This page stopped responding or never existed.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/" variant="primary">
            Back to the desktop <IconArrow size={16} />
          </Button>
          <Button href="/docs">All docs</Button>
        </div>
      </Window>
    </div>
  );
}
