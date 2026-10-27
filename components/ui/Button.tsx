import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "glass" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "btn-primary text-white",
  glass: "border border-line-strong bg-white/[0.04] text-fg hover:bg-white/[0.09]",
  ghost: "text-muted hover:bg-white/[0.06] hover:text-fg",
};

// Internal hrefs use next/link; external ones open in a new tab; `download` serves a file.
export function Button({
  href,
  variant = "glass",
  size = "md",
  download,
  className = "",
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: "sm" | "md";
  download?: boolean | string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const cls = `press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium ${
    size === "sm" ? "h-9 px-3.5 text-[13px]" : "h-11 px-5 text-sm"
  } ${VARIANTS[variant]} ${className}`;
  const external = /^https?:\/\//.test(href);
  if (download) {
    return (
      <a href={href} download={download === true ? "" : download} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
