// A project's "app icon": a glossy rounded square in its accent with its initial,
// the way PolyMarket shows apps.
export function AppIcon({ name, accent, size = 44 }: { name: string; accent: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[30%] font-display font-semibold text-white shadow-[0_8px_24px_-10px_rgba(0,0,0,0.8)]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(145deg, color-mix(in oklab, ${accent} 90%, white) 0%, ${accent} 45%, color-mix(in oklab, ${accent} 55%, black) 100%)`,
      }}
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />
      <span className="relative">{name.charAt(0)}</span>
    </span>
  );
}
