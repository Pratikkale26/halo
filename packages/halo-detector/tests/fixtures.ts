/**
 * Hand-crafted decoded-transaction fixtures used by the rule tests.
 *
 * Each fixture is intentionally minimal — just enough surface area for one
 * rule to fire (or not fire) on it.
 */

import {
  ASSOCIATED_TOKEN_PROGRAM,
  SPL_TOKEN_PROGRAM,
  SYSTEM_PROGRAM,
  TOKEN_2022_PROGRAM,
  TOKEN_INSTRUCTION,
} from "../src/constants.js";
import type { DecodedTransaction } from "../src/types.js";

const USER = "Usr1111111111111111111111111111111111111111";
const ATTACKER_PROGRAM = "Atk1111111111111111111111111111111111111111";
const KAMINO_PROGRAM = "KaminoLending111111111111111111111111111111";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USER_USDC_TOKEN_ACCOUNT = "Tok1111111111111111111111111111111111111111";
const TARGET_KAMINO_VAULT = "Vlt1111111111111111111111111111111111111111";

function base(): Omit<DecodedTransaction, "instructions"> {
  return {
    feePayer: USER,
    signers: [USER],
    writableAccounts: [USER_USDC_TOKEN_ACCOUNT],
    recentBlockhash: "11111111111111111111111111111111",
    hasDurableNonce: false,
  };
}

/** Hex-encode a single byte. */
function hex(byte: number): string {
  return byte.toString(16).padStart(2, "0");
}

/** Build a SystemProgram::Assign instruction targeting the given owner pubkey. */
function buildAssignInstructionData(newOwnerBase58: string): string {
  // Assign discriminator = 1 as little-endian u32.
  const disc = "01000000";
  const ownerBytes = base58Decode(newOwnerBase58);
  let ownerHex = "";
  for (const b of ownerBytes) ownerHex += hex(b);
  return disc + ownerHex;
}

function base58Decode(str: string): Uint8Array {
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

// --- Fixtures ---

/** A clean, expected Kamino-deposit-style transaction. No findings expected. */
export const cleanDepositTx: DecodedTransaction = {
  ...base(),
  instructions: [
    {
      index: 0,
      programId: SPL_TOKEN_PROGRAM,
      accounts: [USER_USDC_TOKEN_ACCOUNT, USDC_MINT, TARGET_KAMINO_VAULT, USER],
      data: hex(TOKEN_INSTRUCTION.TransferChecked),
      name: "spl_token::TransferChecked",
    },
    {
      index: 1,
      programId: KAMINO_PROGRAM,
      accounts: [USER, TARGET_KAMINO_VAULT],
      data: "00",
      name: "kamino::Deposit",
    },
  ],
};

/** Owner-reassignment drainer: small transfer + assign account to attacker. */
export const assignAttackTx: DecodedTransaction = {
  ...base(),
  instructions: [
    {
      index: 0,
      programId: SYSTEM_PROGRAM,
      // Transfer discriminator = 2 (LE u32).
      accounts: [USER, USER],
      data: "02000000" + "0a00000000000000",
      name: "system_program::Transfer",
    },
    {
      index: 1,
      programId: SYSTEM_PROGRAM,
      accounts: [USER_USDC_TOKEN_ACCOUNT],
      data: buildAssignInstructionData(ATTACKER_PROGRAM),
      name: "system_program::Assign",
    },
  ],
};

/** Hidden token Approve to attacker delegate, no user-facing approval mention. */
export const hiddenApprovalTx: DecodedTransaction = {
  ...base(),
  instructions: [
    {
      index: 0,
      programId: SPL_TOKEN_PROGRAM,
      accounts: [USER_USDC_TOKEN_ACCOUNT, ATTACKER_PROGRAM, USER],
      data: hex(TOKEN_INSTRUCTION.Approve) + "ffffffffffffffff",
      name: "spl_token::Approve",
    },
  ],
};

/** Hidden Approve, but the user-facing description does mention 'Approve'. */
export const expectedApprovalTx: DecodedTransaction = {
  ...base(),
  instructions: [
    {
      index: 0,
      programId: SPL_TOKEN_PROGRAM,
      accounts: [USER_USDC_TOKEN_ACCOUNT, KAMINO_PROGRAM, USER],
      data: hex(TOKEN_INSTRUCTION.Approve) + "0a00000000000000",
      name: "spl_token::Approve",
    },
  ],
};

/** Token-2022 transfer that sneaks an attacker-controlled hook program. */
export const transferHookAbuseTx: DecodedTransaction = {
  ...base(),
  instructions: [
    {
      index: 0,
      programId: TOKEN_2022_PROGRAM,
      // TransferChecked layout (4 base accounts) + 1 extra hook account.
      accounts: [
        USER_USDC_TOKEN_ACCOUNT,
        USDC_MINT,
        TARGET_KAMINO_VAULT,
        USER,
        ATTACKER_PROGRAM, // <- the hook program
      ],
      data: hex(TOKEN_INSTRUCTION.TransferChecked) + "01",
      name: "token_2022::TransferChecked",
    },
  ],
};

/** Tx that uses a durable nonce. */
export const durableNonceTx: DecodedTransaction = {
  ...base(),
  hasDurableNonce: true,
  instructions: [
    {
      index: 0,
      programId: SYSTEM_PROGRAM,
      accounts: [USER, USER],
      // AdvanceNonceAccount discriminator = 4.
      data: "04000000",
      name: "system_program::AdvanceNonceAccount",
    },
    {
      index: 1,
      programId: KAMINO_PROGRAM,
      accounts: [USER, TARGET_KAMINO_VAULT],
      data: "00",
    },
  ],
};

/** Blinks bait-and-switch — description says "free NFT", tx touches DEX. */
export const blinksBaitTx: DecodedTransaction = {
  ...base(),
  instructions: [
    {
      index: 0,
      programId: ATTACKER_PROGRAM,
      accounts: [USER],
      data: "00",
      name: "attacker::DrainEverything",
    },
  ],
};

export const PROGRAMS = {
  USER,
  ATTACKER_PROGRAM,
  KAMINO_PROGRAM,
  USDC_MINT,
  USER_USDC_TOKEN_ACCOUNT,
  TARGET_KAMINO_VAULT,
};
