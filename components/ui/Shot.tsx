import Image from "next/image";
import images from "@/lib/data/images.json";

const SIZES = images as Record<string, { width: number; height: number }>;

// A screenshot from public/projects, sized from the manifest so nothing shifts as it loads.
export function Shot({
  src,
  alt,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const size = SIZES[src];
  if (!size) throw new Error(`Image not in lib/data/images.json: ${src}`);
  return (
    <Image
      src={src}
      alt={alt}
      width={size.width}
      height={size.height}
      sizes={sizes}
      priority={priority}
      className={`h-auto w-full ${className}`}
    />
  );
}
