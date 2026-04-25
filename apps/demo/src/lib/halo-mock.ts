/**
 * Mock Halo wiring for the demo.
 *
 * The Expo demo runs on a stock Android emulator with no Seed Vault simulator
 * installed, so we use the SDK's mock backend with a Keypair stand-in. The
 * approve/decline decision is wired to a Promise that the screen resolves
 * from a button press, so the user sees the same UX flow as production.
 */

import { Analyzer, type DecodedTransaction } from "@halo/detector";
import {
  ASSOCIATED_TOKEN_PROGRAM,
  SPL_TOKEN_PROGRAM,
  SYSTEM_PROGRAM,
  TOKEN_2022_PROGRAM,
} from "@halo/detector";

export const PROGRAMS = {
  KAMINO: "KaminoLending111111111111111111111111111111",
  ATTACKER: "Atk1111111111111111111111111111111111111111",
  USDC_MINT: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USER: "Usr1111111111111111111111111111111111111111",
  USER_USDC: "Tok1111111111111111111111111111111111111111",
  KAMINO_VAULT: "Vlt1111111111111111111111111111111111111111",
};

export const KAMINO_ALLOWED = [
  SYSTEM_PROGRAM,
  SPL_TOKEN_PROGRAM,
  TOKEN_2022_PROGRAM,
  ASSOCIATED_TOKEN_PROGRAM,
  PROGRAMS.KAMINO,
];

/** Two scenarios the demo flips between. */
export const SCENARIOS = {
  /** Honest Kamino deposit — should pass cleanly. */
  honestDeposit: {
    title: "Deposit 5,000 USDC into Kamino",
    description: "Deposit 5,000 USDC into Kamino main market for ~7.2% APY",
    valueUsd: 5000,
    expectedRecipientPrograms: [PROGRAMS.KAMINO],
    tx: {
      feePayer: PROGRAMS.USER,
      signers: [PROGRAMS.USER],
      writableAccounts: [PROGRAMS.USER_USDC],
      recentBlockhash: "11111111111111111111111111111111",
      hasDurableNonce: false,
      instructions: [
        {
          index: 0,
          programId: SPL_TOKEN_PROGRAM,
          accounts: [PROGRAMS.USER_USDC, PROGRAMS.USDC_MINT, PROGRAMS.KAMINO_VAULT, PROGRAMS.USER],
          data: "0c", // TransferChecked discriminator
          name: "spl_token::TransferChecked",
        },
        {
          index: 1,
          programId: PROGRAMS.KAMINO,
          accounts: [PROGRAMS.USER, PROGRAMS.KAMINO_VAULT],
          data: "00",
          name: "kamino::Deposit",
        },
      ],
    } satisfies DecodedTransaction,
  },

  /** Drainer dApp masquerading as a "claim airdrop" Blink. */
  drainerBlink: {
    title: "Claim free SOL airdrop",
    description: "Claim 0.05 SOL airdrop reward",
    valueUsd: 12,
    expectedRecipientPrograms: [PROGRAMS.KAMINO], // user thinks it's an airdrop dApp
    tx: {
      feePayer: PROGRAMS.USER,
      signers: [PROGRAMS.USER],
      writableAccounts: [PROGRAMS.USER_USDC],
      recentBlockhash: "11111111111111111111111111111111",
      hasDurableNonce: false,
      instructions: [
        {
          index: 0,
          programId: SYSTEM_PROGRAM,
          accounts: [PROGRAMS.USER, PROGRAMS.USER],
          data: "02000000" + "0a00000000000000",
          name: "system_program::Transfer",
        },
        {
          // The bait-and-switch: Assign the user's account to the attacker.
          index: 1,
          programId: SYSTEM_PROGRAM,
          accounts: [PROGRAMS.USER_USDC],
          // Assign discriminator (1, LE u32) + 32 bytes of attacker pubkey.
          data:
            "01000000" +
            // bs58 "Atk111..." decoded to padded hex (placeholder bytes for demo).
            "ee".repeat(32),
          name: "system_program::Assign",
        },
      ],
    } satisfies DecodedTransaction,
  },
};

export function buildAnalyzer(scenarioKey: keyof typeof SCENARIOS) {
  const scenario = SCENARIOS[scenarioKey];
  return new Analyzer({
    allowedPrograms: KAMINO_ALLOWED,
    blinksContext: {
      description: scenario.description,
      expectedRecipientPrograms: scenario.expectedRecipientPrograms,
    },
  });
}
