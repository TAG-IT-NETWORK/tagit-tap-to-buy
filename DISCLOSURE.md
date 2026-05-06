# Code Reuse Disclosure

**EasyA Consensus Hackathon Miami, May 5–7, 2026**
**Project**: tagit-tap-to-buy
**Project lead**: Artemus Prime, Founder & CEO, TAG IT NETWORK

Per EasyA Consensus Hackathon rules, all reused code is disclosed below.

## Pre-existing TAG IT NETWORK code (used as dependencies, untouched)

| Component | Origin Repo | Purpose | Last commit before hackathon |
|---|---|---|---|
| TAGITCore lifecycle pattern | tagit-contracts | Seven-state asset lifecycle (NONE→MINTED→BOUND→ACTIVATED→CLAIMED→FLAGGED→RECYCLED) | `<commit hash — to fill>` |
| NTAG 424 DNA SUN verification | tagit-sdk | Challenge-response signature verification | `<commit hash — to fill>` |
| verify.tagit.network base UX | tagit-website | PWA verify page foundation | `<commit hash — to fill>` |
| IPFS pinning patterns | tagit-services | Pinata integration for permanent metadata storage | `<commit hash — to fill>` |
| Pre-existing testnet deployments | tagit-contracts (deployed) | TAGITCore on Arbitrum Sepolia, OP Sepolia, Base Sepolia | Deployed pre-hackathon |

Token #18 on Arbitrum Sepolia is the historical demo anchor and remains untouched during hackathon work.

## Net-new code built during EasyA Miami (May 5–7, 2026)

| Component | File | Purpose | First commit |
|---|---|---|---|
| OfferEscrow contract | `contracts/src/OfferEscrow.sol` | P2P escrow with atomic settlement on tap | `<hackathon commit>` |
| OfferEscrow tests | `contracts/test/OfferEscrow.t.sol` | Foundry tests: happy, reentrancy, timeout, replay, double-accept | `<hackathon commit>` |
| Three-layer PWA | `verify/` | Universal → AI brief → wallet action | `<hackathon commit>` |
| Bedrock brief endpoint | `api/src/getBrief.ts` | AI-generated product brief | `<hackathon commit>` |
| x402 paywall middleware | `api/middleware/x402.ts` | 1¢ USDC paywall on brief endpoint | `<hackathon commit>` |
| S3 + DynamoDB metadata | `infra/` | Photo storage + structured metadata | `<hackathon commit>` |
| Coinbase Smart Wallet integration | `verify/lib/wallet.ts` | Layer 3 action surface | `<hackathon commit>` |
| (P1 optional) UPS shipping quote | `api/src/getShippingQuote.ts` | Delivery agent narrative | `<hackathon commit>` |

All commits in this repository are timestamped within the EasyA Miami hackathon window (May 5–7, 2026). Repository created May 5, 2026 after EasyA kickoff.

Signed: Artemus Prime, Project Lead
