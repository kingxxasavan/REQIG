import type { ReactNode } from "react";

// A PolyOS style window: glass surface, a title bar with an app icon, and the
// decorative minimize / maximize / close dots on the right.
export function Window({
  title,
  icon,
  id,
  accent,
  className = "",
  bodyClassName = "p-5 sm:p-8",
  children,
}: {
  title: string;
  icon?: ReactNode;
  id?: string;
  accent?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`window scroll-mt-6 ${className}`} style={accent ? ({ "--accent-color": accent } as React.CSSProperties) : undefined}>
      <div className="window-bar">
        <span className="window-icon" aria-hidden>
          {icon}
        </span>
        <h2 id={headingId} className="truncate text-[13px] font-medium tracking-wide text-muted">
          {title}
        </h2>
        <span className="ml-auto flex items-center gap-2" aria-hidden>
          <i className="window-dot" />
          <i className="window-dot" />
          <i className="window-dot window-dot-close" />
        </span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
