/**
 * Policy helpers — canonical hashing of the off-chain policy JSON so the
 * `policyHash` recorded on-chain matches the off-chain document a dApp ships.
 */

/**
 * Canonicalise a JSON-able value: sort object keys recursively, then
 * JSON.stringify with no whitespace. This produces a stable byte sequence
 * regardless of key insertion order.
 */
export function canonicaliseJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);
  return out;
}

/**
 * SHA-256 of canonicalised JSON, returned as a 32-byte Uint8Array.
 *
 * Works in both Node and browser/RN runtimes — Node uses `crypto.subtle` if
 * available (always available on Node 20+), RN's Hermes ships it, and any
 * environment that lacks it falls back to a polyfilled implementation.
 */
export async function hashPolicyJson(value: unknown): Promise<Uint8Array> {
  const canonical = canonicaliseJson(value);
  const bytes = new TextEncoder().encode(canonical);

  if (typeof globalThis.crypto?.subtle?.digest === "function") {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return new Uint8Array(digest);
  }
  // Last-resort fallback for very old JS runtimes — defer to Node's crypto.
  // Dynamic import keeps this tree-shakeable for browsers.
  const { createHash } = await import("crypto");
  return new Uint8Array(createHash("sha256").update(bytes).digest());
}
