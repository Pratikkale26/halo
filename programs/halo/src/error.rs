use anchor_lang::prelude::*;

#[error_code]
pub enum HaloError {
    #[msg("Attestation has expired")]
    AttestationExpired,

    #[msg("Attestation user does not match expected user")]
    UserMismatch,

    #[msg("Attestation policy does not match expected policy")]
    PolicyMismatch,

    #[msg("Attestation issuer is not the registered authority")]
    IssuerMismatch,

    #[msg("Policy has been revoked")]
    PolicyRevoked,

    #[msg("Risk score exceeds policy threshold")]
    RiskScoreTooHigh,

    #[msg("Attestation is for a different transaction hash")]
    TransactionHashMismatch,

    #[msg("Attestation signature verification failed")]
    InvalidSignature,

    #[msg("Policy parameters are invalid")]
    InvalidPolicyParams,

    #[msg("Caller is not authorized to perform this action")]
    Unauthorized,

    #[msg("Attestation account is not owned by the Halo program")]
    InvalidAttestationOwner,

    #[msg("Provided issuer authority does not match the registered authority")]
    IssuerAuthorityMismatch,
}
