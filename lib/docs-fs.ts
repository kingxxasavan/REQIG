import { readFileSync } from "node:fs";
import path from "node:path";
import type { Doc } from "@/lib/data/docs";

export function readDoc(doc: Doc): string {
  return readFileSync(path.join(process.cwd(), "content", doc.file), "utf8");
}
