#!/usr/bin/env bash
# Generate the deployer + program keypairs for Halo on devnet.
#
# Idempotent: skips any keypair that already exists. Prints the resulting
# pubkeys so they can be copy-pasted into Anchor.toml + the grant application.
#
# Usage:
#   bash scripts/gen-keypair.sh

set -euo pipefail

KEYS_DIR="$(cd "$(dirname "$0")/.." && pwd)/.keys"
mkdir -p "$KEYS_DIR"

generate() {
  local name="$1"
  local path="$KEYS_DIR/$name.json"
  if [[ -f "$path" ]]; then
    echo "[skip] $name already exists at $path"
  else
    solana-keygen new --no-bip39-passphrase --silent --outfile "$path"
    echo "[ok]   $name created at $path"
  fi
  echo "       pubkey: $(solana-keygen pubkey "$path")"
}

echo "==> Generating Halo dev keypairs into $KEYS_DIR"
generate deployer
generate halo-program
generate issuer-authority
generate policy-authority

cat <<'EOF'

==> Done.

Copy the program-id pubkey above into:
  - Anchor.toml         (programs.localnet.halo + programs.devnet.halo)
  - programs/halo/src/lib.rs   (declare_id!(...))

Then run:
  anchor build
  anchor keys sync           # auto-syncs the program ID across files
  solana airdrop 5 $(solana-keygen pubkey "$KEYS_DIR/deployer.json") --url devnet
  anchor deploy --provider.cluster devnet --provider.wallet "$KEYS_DIR/deployer.json"
EOF
