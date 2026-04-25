/**
 * Transaction-decoding helpers — convert a Solana web3.js Transaction or
 * VersionedTransaction into the @halo/detector's DecodedTransaction shape.
 *
 * Kept intentionally simple. Production builds will swap this for a full
 * IDL-aware decoder (Helius parsed-tx API style) so the detector can see
 * decoded args, not just discriminators.
 */

import type { DecodedInstruction, DecodedTransaction } from "@halo/detector";
import {
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  type CompiledInstruction,
  type MessageCompiledInstruction,
} from "@solana/web3.js";

export async function sha256Bytes(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof globalThis.crypto?.subtle?.digest === "function") {
    const out = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return new Uint8Array(out);
  }
  const { createHash } = await import("crypto");
  return new Uint8Array(createHash("sha256").update(bytes).digest());
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function decodeTransaction(
  tx: Transaction | VersionedTransaction,
): DecodedTransaction {
  if (tx instanceof Transaction) return decodeLegacy(tx);
  return decodeVersioned(tx);
}

function decodeLegacy(tx: Transaction): DecodedTransaction {
  const message = tx.compileMessage();
  const accounts = message.accountKeys.map((k) => k.toBase58());
  const writableAccounts = accounts.filter((_, i) => message.isAccountWritable(i));
  const signers = accounts.filter((_, i) => message.isAccountSigner(i));

  const instructions: DecodedInstruction[] = message.instructions.map(
    (ci: CompiledInstruction, index: number) => ({
      index,
      programId: accounts[ci.programIdIndex],
      accounts: ci.accounts.map((idx) => accounts[idx]),
      data: bytesToBase64(decodeBs58(ci.data)),
    }),
  );

  return {
    feePayer: accounts[0],
    signers,
    writableAccounts,
    instructions,
    recentBlockhash: message.recentBlockhash,
    hasDurableNonce: false,
  };
}

function decodeVersioned(tx: VersionedTransaction): DecodedTransaction {
  const message = tx.message;
  const compiled = TransactionMessage.decompile(message);
  const accounts = message.staticAccountKeys.map((k) => k.toBase58());

  // Best-effort signer / writable computation from header counts.
  const numSigners = message.header.numRequiredSignatures;
  const writableSignerCount =
    message.header.numRequiredSignatures - message.header.numReadonlySignedAccounts;
  const writableNonSignerCount =
    message.staticAccountKeys.length -
    message.header.numRequiredSignatures -
    message.header.numReadonlyUnsignedAccounts;

  const signers = accounts.slice(0, numSigners);
  const writableAccounts = [
    ...accounts.slice(0, writableSignerCount),
    ...accounts.slice(numSigners, numSigners + writableNonSignerCount),
  ];

  const instructions: DecodedInstruction[] = message.compiledInstructions.map(
    (ci: MessageCompiledInstruction, index: number) => ({
      index,
      programId: accounts[ci.programIdIndex] ?? "<lookup-table>",
      accounts: ci.accountKeyIndexes.map((idx) => accounts[idx] ?? "<lookup-table>"),
      data: bytesToBase64(ci.data),
    }),
  );

  // Conservative durable-nonce signal: legacy field on the message, not always
  // populated. Real production decoder reads the AdvanceNonceAccount inst.
  const hasDurableNonce = compiled.instructions.some(
    (ix) =>
      ix.programId.toBase58() === "11111111111111111111111111111111" &&
      ix.data.length >= 4 &&
      ix.data.readUInt32LE(0) === 4,
  );

  return {
    feePayer: accounts[0],
    signers,
    writableAccounts,
    instructions,
    recentBlockhash: message.recentBlockhash,
    hasDurableNonce,
  };
}

/** Tiny bs58 decoder — only used to convert legacy compiled-instruction `data`. */
function decodeBs58(str: string): Uint8Array {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes: number[] = [];
  for (const ch of str) {
    let carry = ALPHABET.indexOf(ch);
    if (carry < 0) throw new Error(`invalid base58 char ${ch}`);
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let zeros = 0;
  while (zeros < str.length && str[zeros] === "1") zeros++;
  for (let i = 0; i < zeros; i++) bytes.push(0);
  return new Uint8Array(bytes.reverse());
}

export function getTxMessageBytes(tx: Transaction | VersionedTransaction): Uint8Array {
  if (tx instanceof Transaction) return tx.compileMessage().serialize();
  return tx.message.serialize();
}
