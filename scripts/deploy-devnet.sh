#!/usr/bin/env bash
# Deploy the Halo program to Solana devnet.
#
# Pre-conditions:
#   - scripts/gen-keypair.sh has been run (.keys/ populated)
#   - Anchor.toml + programs/halo/src/lib.rs declare_id! match the
#     generated program-id pubkey
#   - The deployer keypair has at least 5 SOL (use solana airdrop)
#
# Usage:
#   bash scripts/deploy-devnet.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYS_DIR="$ROOT/.keys"
DEPLOYER="$KEYS_DIR/deployer.json"
PROGRAM_KEYPAIR="$KEYS_DIR/halo-program.json"

if [[ ! -f "$DEPLOYER" ]]; then
  echo "missing $DEPLOYER — run scripts/gen-keypair.sh first" >&2
  exit 1
fi
if [[ ! -f "$PROGRAM_KEYPAIR" ]]; then
  echo "missing $PROGRAM_KEYPAIR — run scripts/gen-keypair.sh first" >&2
  exit 1
fi

DEPLOYER_PUBKEY="$(solana-keygen pubkey "$DEPLOYER")"
PROGRAM_ID="$(solana-keygen pubkey "$PROGRAM_KEYPAIR")"

echo "==> Deployer:   $DEPLOYER_PUBKEY"
echo "==> Program ID: $PROGRAM_ID"
echo "==> Cluster:    https://api.devnet.solana.com"
echo

echo "==> Building program"
anchor build --provider.cluster devnet --provider.wallet "$DEPLOYER" --program-keypair "$PROGRAM_KEYPAIR"

echo "==> Checking deployer balance"
DEPLOYER_BALANCE=$(solana balance "$DEPLOYER_PUBKEY" --url devnet | awk '{print $1}')
echo "    balance: $DEPLOYER_BALANCE SOL"
if (( $(echo "$DEPLOYER_BALANCE < 4" | bc -l) )); then
  echo "    requesting devnet airdrop..."
  solana airdrop 5 "$DEPLOYER_PUBKEY" --url devnet
fi

echo "==> Deploying"
anchor deploy --provider.cluster devnet --provider.wallet "$DEPLOYER" --program-keypair "$PROGRAM_KEYPAIR"

echo
echo "==> Done."
echo "    program: $PROGRAM_ID"
echo "    explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo
echo "Next: bash scripts/seed-policy.sh   # registers the demo policy on-chain"
