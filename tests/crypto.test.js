import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveKey, newSalt, encryptJSON, decryptJSON, unlockEnvelope } from "../src/lib/crypto.js";

test("AES-256-GCM round trip and wrong-passphrase rejection", async () => {
  const salt = newSalt();
  const key = await deriveKey("correct horse battery staple", salt);
  const env = await encryptJSON({ revenue: 1234, name: "Test Co" }, key, salt);
  assert.equal(env.alg, "AES-256-GCM");
  assert.ok(!env.ct.includes("Test Co"));
  assert.deepEqual(await decryptJSON(env, key), { revenue: 1234, name: "Test Co" });
  const { data } = await unlockEnvelope(env, "correct horse battery staple");
  assert.equal(data.revenue, 1234);
  await assert.rejects(unlockEnvelope(env, "wrong passphrase"));
});

test("tampered ciphertext fails authentication", async () => {
  const salt = newSalt();
  const key = await deriveKey("pw-123456789", salt);
  const env = await encryptJSON({ a: 1 }, key, salt);
  const bytes = Uint8Array.from(atob(env.ct), (c) => c.charCodeAt(0));
  bytes[0] ^= 0xff;
  const tampered = { ...env, ct: btoa(String.fromCharCode(...bytes)) };
  await assert.rejects(decryptJSON(tampered, key));
});
