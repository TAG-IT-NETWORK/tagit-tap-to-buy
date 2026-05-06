# Demo flow — 3 minutes on stage

| Step | Time | Action | What audience sees |
|---|---|---|---|
| 1 | 0:00 | Hold up VT cream jar | Real product, real chip |
| 2 | 0:15 | Audience member taps with phone | PWA loads in <2s, AUTHENTIC + BOUND |
| 3 | 0:35 | Click "Get details — 1¢ via x402" | Wallet prompts USDC transfer |
| 4 | 0:50 | Confirm 1¢ payment | Bedrock brief streams in, photo + custody + scans |
| 5 | 1:25 | "Want to buy?" → Connect Wallet | Coinbase Smart Wallet appears (passkey) |
| 6 | 1:45 | Enter 30 USDC, sign EIP-712 offer | OfferEscrow.fundOffer() locks USDC |
| 7 | 2:10 | Owner accepts on stage | Atomic swap — NFT → buyer, USDC → seller |
| 8 | 2:30 | Audience member taps chip again | New owner displayed |
| 9 | 2:45 | Tomorrow slide | Agentic attestation economy pitch |
| 10 | 3:00 | Close | "Find us in the Dealflow Zone" |

## Pre-flight (Day 3 morning, before pitch)

- [ ] OfferEscrow deployed to Base Sepolia + verified on Basescan
- [ ] Demo NFT minted, chip bound, lifecycle = CLAIMED
- [ ] Owner wallet funded with ETH for gas + NFT approved to escrow
- [ ] Buyer wallet funded with ≥50 USDC on Base Sepolia
- [ ] `NEXT_PUBLIC_OFFER_ESCROW_ADDRESS` set in Vercel
- [ ] Bedrock cache warmed for chipId=vt-cream-001
- [ ] Cellular hotspot tethered + tested
- [ ] Loom recording uploaded
- [ ] DISCLOSURE.md commit hashes filled in

## Reset between rehearsals

```bash
# 1. Re-mint demo state (script TBD)
# 2. Wipe DynamoDB metadata? — no, keep for warm cache
# 3. Re-fund buyer wallet from faucet if balance low
```

## Fallback: pre-recorded demo video

Record Day 2 evening — 90s screen-capture of the full flow. Playable from laptop if any live element fails.
