# Architecture — TAG IT Tap-to-Buy

## Three-layer page

```
[NFC Chip on VT cream jar]
    │ (NTAG SUN tap)
    ▼
[verify.tagit.network/<chipId>]   PWA, Next.js 14
    │
    ├── Layer 1 — Universal verification (no wallet)
    │       reads ownerOf(tokenId) from Base Sepolia
    │       displays AUTHENTIC + lifecycle + last-verified + reputation
    │
    ├── Layer 2 — AI brief (x402-gated, 1¢ USDC)
    │       402 → wallet pays USDC.transfer → retry with X-PAYMENT-PROOF
    │       Lambda → DynamoDB metadata → S3 photo → Bedrock Claude brief
    │
    └── Layer 3 — Wallet action (Coinbase Smart Wallet)
            buyer signs EIP-712 Offer → fundOffer() locks USDC in escrow
            seller acceptOffer() OR buyer-on-receive acceptOfferByTap()
            atomic swap: NFT → buyer, USDC → seller
```

## Components

| Layer | Component | Notes |
|---|---|---|
| 1 | Next.js PWA `verify/app/verify/[chipId]` | Server-rendered shell, client hydrates wagmi + reads on-chain |
| 2 | Express API `api/src/server.ts` (deployable as Lambda) | x402 middleware → DDB lookup → Bedrock Converse |
| 2 | DynamoDB `tagit-tap-to-buy-metadata` | PK: `chipId`. Stores nft, tokenId, custody, recalls, photoKey |
| 2 | S3 `tagit-tap-to-buy-photos` | Photos behind CloudFront, presigned GETs from Lambda |
| 2 | Bedrock | `us.anthropic.claude-haiku-4-5-20251001-v1:0` (fast, cheap) |
| 3 | `OfferEscrow.sol` on Base Sepolia | EIP-712 offers, EIP-1271 sigs (smart wallets), reentrancy guards |

## Trust model

- **Layer 1**: trustless. Reads on-chain state only. No surface to attack.
- **Layer 2**: payment proof = on-chain USDC.transfer to recipient (Base Sepolia). Replay-protected via tx hash uniqueness.
- **Layer 3**: offer = EIP-712 signature. Atomic settlement = `OfferEscrow` reentrancy-guarded `_settle()`. Tap-on-receive = SUN signature with monotonic counter.

## Failure modes & fallbacks

- Bedrock rate-limit → in-process LRU cache (60s TTL) for demo asset
- Base Sepolia slow → pre-funded gas, generous deadlines on offers
- iOS NFC quirks → Android phone backup
- Stage wifi → cellular hotspot ready

## Out of scope (hackathon)

- Cross-chain
- Full BIDGES role gating
- Mainnet deployment
- Subgraph indexing (Goldsky planned for P2)
