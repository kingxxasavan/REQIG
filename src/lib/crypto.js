// Client-side encryption for the workspace. Everything the app stores in the
// browser can be sealed with AES-256-GCM using a key derived from a passphrase
// the owner chooses. The key only ever lives in memory: reloading the page
// locks the workspace again.

const enc = new TextEncoder();
const dec = new TextDecoder();

export const KDF_ITERATIONS = 310_000; // OWASP guidance for PBKDF2-HMAC-SHA256

const toB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
};
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export async function deriveKey(passphrase, salt, iterations = KDF_ITERATIONS) {
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function newSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Returns a self-describing envelope; the salt and IV are not secret.
export async function encryptJSON(data, key, salt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  return { v: 1, alg: "AES-256-GCM", kdf: "PBKDF2-SHA256", iter: KDF_ITERATIONS, salt: toB64(salt), iv: toB64(iv), ct: toB64(ct) };
}

// Throws if the passphrase is wrong or the ciphertext was tampered with —
// GCM authenticates as well as encrypts.
export async function decryptJSON(envelope, key) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(envelope.iv) }, key, fromB64(envelope.ct));
  return JSON.parse(dec.decode(pt));
}

export async function unlockEnvelope(envelope, passphrase) {
  const salt = fromB64(envelope.salt);
  const key = await deriveKey(passphrase, salt, envelope.iter || KDF_ITERATIONS);
  const data = await decryptJSON(envelope, key);
  return { data, key, salt };
}

export function passphraseStrength(p = "") {
  let score = 0;
  if (p.length >= 10) score++;
  if (p.length >= 14) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score] };
}
