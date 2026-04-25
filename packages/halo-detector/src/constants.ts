/**
 * Constants — well-known program IDs, instruction discriminators, severity
 * weights. Centralised here so a future audit pass has one place to verify.
 */

export const SYSTEM_PROGRAM = "11111111111111111111111111111111";
export const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
export const ASSOCIATED_TOKEN_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
export const COMPUTE_BUDGET_PROGRAM = "ComputeBudget111111111111111111111111111111";

/**
 * SystemInstruction discriminators. The first 4 bytes of `data` (little-endian
 * u32) for each variant.
 */
export const SYSTEM_INSTRUCTION = {
  CreateAccount: 0,
  Assign: 1,
  Transfer: 2,
  CreateAccountWithSeed: 3,
  AdvanceNonceAccount: 4,
  WithdrawNonceAccount: 5,
  InitializeNonceAccount: 6,
  AuthorizeNonceAccount: 7,
  Allocate: 8,
  AllocateWithSeed: 9,
  AssignWithSeed: 10,
  TransferWithSeed: 11,
  UpgradeNonceAccount: 12,
} as const;

/**
 * SPL Token instruction discriminators (single byte at start of `data`).
 */
export const TOKEN_INSTRUCTION = {
  InitializeMint: 0,
  InitializeAccount: 1,
  InitializeMultisig: 2,
  Transfer: 3,
  Approve: 4,
  Revoke: 5,
  SetAuthority: 6,
  MintTo: 7,
  Burn: 8,
  CloseAccount: 9,
  FreezeAccount: 10,
  ThawAccount: 11,
  TransferChecked: 12,
  ApproveChecked: 13,
  MintToChecked: 14,
  BurnChecked: 15,
} as const;

/** Severity weights used to compute the aggregate risk score (0-100). */
export const SEVERITY_WEIGHTS: Record<"info" | "warning" | "critical", number> = {
  info: 5,
  warning: 25,
  critical: 80,
};
