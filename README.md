# TAG IT Tap-to-Buy

> Physical truth for AI commerce. Tap, verify, transact, settle — all in seconds.

**Built at EasyA Consensus Hackathon Miami, May 5–7, 2026**
**Tracks**: Coinbase ($5K) + AWS ($40K credits)
**Project lead**: Artemus Prime, Founder & CEO, [TAG IT NETWORK](https://tagit.network)

---

## Problem

AI agents are about to spend trillions on physical things — watches, furniture, parts, products. Today they're spending blind. They can't tell real from fake. They can't verify a watch is on a wrist or a chair is in a warehouse.

## Solution

NFC chip + on-chain twin + wallet action layer. Tap a chip, verify in 2 seconds, transact in one tap-confirmed atomic settlement.

## Demo flow

1. **Tap** the VT PDRN Capsule Cream jar with any phone.
2. **Verify** — PWA loads in <2s. AUTHENTIC. BOUND. Owner: `0x458B…`. Last verified: just now.
3. **Pay 1¢** via Coinbase x402 → AI brief streams in (Bedrock + photo + history).
4. **Connect Wallet** → Coinbase Smart Wallet appears (passkey, no seed phrase).
5. **Offer 30 USDC** → `OfferEscrow` locks the funds on Base Sepolia.
6. **Owner accepts** → atomic NFT-and-USDC swap. Ownership transfers, escrow releases.
7. **Tap again** — page now shows the buyer as new owner.

## Architecture

```
[NFC Chip] ─tap─► [verify.tagit.network/<chipId>] (PWA)
                       │
   ┌───────────────────┼───────────────────┐
   ▼                   ▼                   ▼
Layer 1            Layer 2            Layer 3
On-chain read      x402 brief         Wallet action
(no wallet)        (1¢ USDC)          (Coinbase Smart Wallet)
   │                   │                   │
[Base Sepolia]    [Lambda]            [OfferEscrow.sol]
[AssetVault]      [Bedrock]                │
                  [S3]                [Atomic settle]
                  [DynamoDB]          [NFT + USDC swap]
```

## Track alignment

### Coinbase ($5K)
- **Smart Wallet** powers Layer 3 (passkey, no seed phrase)
- **x402** gates the AI brief (1¢ USDC paywall, real micropayment)
- **Base Sepolia** hosts `OfferEscrow.sol` and settlements

### AWS ($40K credits)
- **Bedrock** generates AI brief (Claude on Bedrock)
- **Lambda** orchestrates request flow + x402 middleware
- **S3 + CloudFront** hosts photos
- **DynamoDB** stores structured metadata
- **EventBridge** logs taps for analytics
- **Secrets Manager** holds UPS API key (P1)

## Pre-existing TAG IT NETWORK code (used as dependencies)

See [DISCLOSURE.md](./DISCLOSURE.md) for the full reuse manifest required by EasyA hackathon rules.

- TAGITCore lifecycle pattern — `tagit-contracts`
- NTAG 424 DNA SUN verification — `tagit-sdk`
- verify.tagit.network base UX — `tagit-website`
- IPFS pinning patterns — `tagit-services`

## Net-new code built during EasyA Miami (May 5–7, 2026)

- `contracts/src/OfferEscrow.sol` — atomic NFT/USDC settlement on tap
- `verify/` — three-layer PWA verification page
- `api/getBrief/` — Bedrock + Lambda brief endpoint
- `api/middleware/x402.ts` — 1¢ USDC paywall
- `infra/` — S3 + DynamoDB metadata layer
- `verify/lib/wallet.ts` — Coinbase Smart Wallet integration

## How to run locally

```bash
# Contracts
cd contracts
forge install
forge test -vvv

# Frontend
cd verify
pnpm install
pnpm dev

# API (local SAM)
cd api
sam local start-api
```

## Roadmap (Part Two)

Full e-commerce trust layer + agentic attestation economy. Buyer-agents pay seller-humans for fresh taps. Every chipped item becomes a self-attesting asset. See sibling Notion project: **TAG IT Trust Infrastructure — Agentic Commerce Layer**.

## License

MIT — see [LICENSE](./LICENSE).

## TAG IT NETWORK

Three testnets live (Arbitrum Sepolia, OP Sepolia, Base Sepolia). 12 federated repos. Real chips on real products with real chains and real wallets.

[tagit.network](https://tagit.network)
