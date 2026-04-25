/**
 * Decoding helpers used by the rules.
 *
 * Rules call these to interpret instruction data without each one having to
 * re-implement base64/hex decoding.
 */

/** Decode a base64-encoded instruction data string into a Uint8Array. */
export function decodeBase64(data: string): Uint8Array {
  // Works in both Node (Buffer) and react-native (atob).
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(data, "base64"));
  }
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Decode an instruction data string that may be base64 OR hex. */
export function decodeData(data: string): Uint8Array {
  if (/^[0-9a-fA-F]+$/.test(data) && data.length % 2 === 0) {
    const out = new Uint8Array(data.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(data.substr(i * 2, 2), 16);
    }
    return out;
  }
  return decodeBase64(data);
}

/** Read a little-endian u32 from the first 4 bytes. */
export function readU32LE(bytes: Uint8Array, offset = 0): number | null {
  if (bytes.length < offset + 4) return null;
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    ((bytes[offset + 3] << 24) >>> 0)
  );
}

/** Returns the SystemProgram discriminator (u32 LE) or null if data is too short. */
export function systemInstructionDiscriminator(data: string): number | null {
  return readU32LE(decodeData(data));
}

/** Returns the SPL Token discriminator (u8) or null if data is empty. */
export function tokenInstructionDiscriminator(data: string): number | null {
  const bytes = decodeData(data);
  return bytes.length === 0 ? null : bytes[0];
}
