use anchor_lang::prelude::*;

/// Seed prefixes for PDAs.
pub const ISSUER_AUTHORITY_SEED: &[u8] = b"issuer";
pub const POLICY_SEED: &[u8] = b"policy";
pub const ATTESTATION_SEED: &[u8] = b"attestation";

/// Maximum length of the off-chain policy schema URI (e.g., a Pinata/IPFS link).
pub const MAX_SCHEMA_URI_LEN: usize = 256;

/// Singleton account holding the active issuer authority pubkey and the
/// upgrade authority that can rotate it.
///
/// At MVP, `upgrade_authority` is a single dev keypair under Pratik. Before any
/// production wallet integration, this migrates to a 2-of-3 Squads multisig
/// (HALO.md §17 item 4).
#[account]
#[derive(Default, InitSpace)]
pub struct IssuerAuthority {
    /// Authority that signs attestations. Rotatable by upgrade_authority.
    pub authority: Pubkey,
    /// Authority that can rotate `authority` and revoke policies.
    pub upgrade_authority: Pubkey,
    /// Unix timestamp of last rotation. Useful for key-hygiene auditing.
    pub last_rotated_at: i64,
    /// PDA bump.
    pub bump: u8,
}

/// On-chain registration of a risk policy. dApps reference these by their
/// `policy_hash` when requesting hardware-attested signing.
///
/// The actual policy DSL lives off-chain (IPFS / Arweave / GitHub). The
/// `policy_hash` stored here is a SHA-256 of the canonical JSON. Changing the
/// off-chain doc would change the hash, invalidating attestations.
#[account]
#[derive(InitSpace)]
pub struct PolicyRegistry {
    /// Authority that registered (and can revoke) this policy. Typically the
    /// dApp team's program upgrade authority.
    pub authority: Pubkey,
    /// Hash of the canonical off-chain policy JSON.
    pub policy_hash: [u8; 32],
    /// Off-chain URI for the policy schema (IPFS / HTTPS / Arweave).
    #[max_len(MAX_SCHEMA_URI_LEN)]
    pub schema_uri: String,
    /// Maximum acceptable risk score from the on-device detector (0-100).
    pub max_risk_score: u8,
    /// Maximum age of an attestation, in seconds, before it expires.
    pub max_age_secs: i64,
    /// Whether this policy is currently revoked.
    pub revoked: bool,
    /// Unix timestamp the policy was registered.
    pub created_at: i64,
    /// Unix timestamp the policy was revoked (0 if not revoked).
    pub revoked_at: i64,
    /// PDA bump.
    pub bump: u8,
}

/// A hardware-attested credential issued after the user approved a transaction
/// inside the Seeker's secure execution environment. Stored as a PDA under
/// `[ATTESTATION_SEED, user, tx_hash]` so a dApp can look it up
/// deterministically given the transaction it's about to execute.
#[account]
#[derive(InitSpace)]
pub struct Attestation {
    /// User the attestation is bound to.
    pub user: Pubkey,
    /// Hash of the transaction the user approved (SHA-256 of compiled message).
    pub tx_hash: [u8; 32],
    /// Hash of the policy that was applied.
    pub policy_hash: [u8; 32],
    /// PDA address of the policy account.
    pub policy: Pubkey,
    /// Risk score reported by the on-device detector (0-100, lower is safer).
    pub risk_score: u8,
    /// Issuer authority that signed this attestation.
    pub issuer: Pubkey,
    /// Optional Seeker Genesis Token account proving device-bound issuance.
    /// Pubkey::default() if device-bind is not enforced.
    pub seeker_genesis_token: Pubkey,
    /// Unix timestamp the attestation was issued.
    pub issued_at: i64,
    /// PDA bump.
    pub bump: u8,
}

impl Attestation {
    /// Returns true if the attestation has expired given a max-age window.
    pub fn is_expired(&self, now_unix_ts: i64, max_age_secs: i64) -> bool {
        now_unix_ts.saturating_sub(self.issued_at) > max_age_secs
    }
}
