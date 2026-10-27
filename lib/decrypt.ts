export const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/";

// One frame of the decrypt effect: characters before `progress` are final, the rest
// are random glyphs. Spaces always stay spaces so words keep their shape.
export function scrambleFrame(text: string, progress: number, rand: () => number): string {
  const p = Math.min(1, Math.max(0, progress));
  const revealed = Math.floor(p * text.length);
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    out += i < revealed || ch === " " ? ch : GLYPHS[Math.floor(rand() * GLYPHS.length) % GLYPHS.length];
  }
  return out;
}
