# Code Reuse Disclosure

**EasyA Consensus Hackathon Miami, May 5–7, 2026**
**Project**: tagit-tap-to-buy
**Project lead**: Artemus Prime, Founder & CEO, TAG IT NETWORK

Per EasyA Consensus Hackathon rules, all reused code is disclosed below.

## Pre-existing TAG IT NETWORK code (used as dependencies, untouched)

| Component | Origin Repo | Purpose | Last commit before hackathon |
|---|---|---|---|
| TAGITCore lifecycle pattern | tagit-contracts | Seven-state asset lifecycle (NONE→MINTED→BOUND→ACTIVATED→CLAIMED→FLAGGED→RECYCLED). The verify PWA reads `getAsset(tokenId)` from the TAGITCore proxy on Base Sepolia at `0x3aDc7EFDb58Ae85483eFf5D4966D916185f31d1D`. | `87e2788` |
| NTAG 424 DNA SUN verification | tagit-sdk | Challenge-response signature verification primitive (referenced in `OfferEscrow` for the tap-on-receive monotonic counter design). | `9ffc6b3` |
| verify.tagit.network base UX | tagit-website | PWA verify page foundation and visual language. | `394d48f` |
| IPFS pinning patterns | tagit-services | Pinata integration for permanent metadata storage. The demo asset's metadata JSON is pinned at `QmZLqbsFDKpHc4BsnP4fVcNd4PEi6JriR9MUmJ9bia6oKQ`. | `f430e4d` |
| Pre-existing testnet deployments | tagit-contracts (deployed) | TAGITCore deployed pre-hackathon on Arbitrum Sepolia, OP Sepolia, and Base Sepolia. Token #18 on Arbitrum Sepolia is the historical demo anchor and remains untouched during hackathon work. | Deployed pre-hackathon |

## Net-new code built during EasyA Miami (May 5–7, 2026)

### Shipped & deployed

| Component | File | Purpose | Commit |
|---|---|---|---|
| OfferEscrow contract | `contracts/src/OfferEscrow.sol` | P2P escrow, EIP-712 offers, EIP-1271 smart-wallet sigs, atomic settle on tap-on-receive, timeout refund, cancel. Deployed and verified on Base Sepolia at `0x213767060F842A7bFF6E3Ce30249eDbd177c02c5`. | `45fef0c`, `2b4a9e2` |
| OfferEscrow Foundry tests | `contracts/test/OfferEscrow.t.sol` | 13 tests: happy path, reentrancy attack, double-fund nonce replay, double-accept, non-owner accept, expired, forged sig, timeout, cancel, tap-accept, stale-counter replay. All passing. | `45fef0c` |
| Three-layer verify PWA | `verify/` | Next.js 14 PWA. Layer 1 reads `TAGITCore.getAsset()` on Base Sepolia. Layer 3 signs EIP-712 offers and calls `OfferEscrow.fundOffer`. Deployed at [tagit-tap-to-buy.vercel.app](https://tagit-tap-to-buy.vercel.app). | `45fef0c`, `2b4a9e2` |
| Chip resolver API route | `verify/app/api/resolve/route.ts` | Next.js Route Handler returning chip → asset binding for the demo. Static map for hackathon scope. | `2b4a9e2` |
| Coinbase Smart Wallet integration | `verify/lib/wallet.ts` | wagmi config with `coinbaseWallet({preference:'smartWalletOnly'})`. Layer 3 action surface. | `45fef0c` |
| OfferForm offer signing | `verify/app/verify/[chipId]/verify-client.tsx` | EIP-712 typed-data signing, USDC `approve`, `OfferEscrow.fundOffer` orchestration with progressive UI states. | `2b4a9e2` |
| Foundry deploy script | `contracts/script/Deploy.s.sol` | Reproducible deploy of `OfferEscrow` to Base Sepolia with Basescan verification. | `45fef0c` |

### Scaffolded, not deployed (cut from hackathon scope to ship L1 + L3 cleanly)

| Component | File | Purpose | Commit |
|---|---|---|---|
| Bedrock brief endpoint | `api/src/getBrief.ts` | Claude Haiku 4.5 brief generation (Bedrock SDK v3). | `45fef0c` |
| x402 paywall middleware | `api/middleware/x402.ts` | 1¢ USDC paywall on the brief endpoint with payment-proof validation. | `45fef0c` |
| DynamoDB chip resolver | `api/src/resolveChip.ts` | Production chip → asset lookup against DynamoDB. | `45fef0c` |
| S3 + DynamoDB seed script | `infra/seed-demo.ts` | Provisioning + seed for the metadata layer. | `45fef0c` |

## Repository commit history

```
1744f50  docs(readme): add hero banner + live demo URL + deployed addresses
2b4a9e2  feat(tap-to-buy): deploy OfferEscrow + wire L1 read + L3 offer signing
45fef0c  init: tagit-tap-to-buy hackathon vertical
```

All commits in this repository are timestamped within the EasyA Miami hackathon window (May 5–7, 2026). Repository created May 5, 2026 after EasyA kickoff.

Signed: Artemus Prime, Project Lead
