import type { Request, Response, NextFunction } from 'express';
import { createPublicClient, http, parseAbi, getAddress, parseUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

/**
 * x402 paywall middleware.
 *
 * On first request: respond 402 with a quote (amount, recipient, nonce, expiry).
 * Client pays via USDC.transfer on Base Sepolia and submits the tx hash as
 * `X-PAYMENT-PROOF`. Middleware validates the on-chain transfer matches the
 * quote and the nonce isn't replayed, then calls next().
 *
 * Note: hackathon-grade. Production would use the formal x402 envelope with
 * EIP-3009 transferWithAuthorization for off-chain settlement, not on-chain
 * verification. Keeping this implementation simple and demo-able.
 */

const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const PRICE_USDC = parseUnits(process.env.X402_PRICE_USDC ?? '0.01', 6);
const RECIPIENT = (process.env.X402_RECIPIENT ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL),
});

const usedTxs = new Set<string>(); // process-local nonce store; production = DynamoDB
const RATE_LIMIT_PER_WALLET_PER_MIN = 10;
const recentByPayer: Map<string, number[]> = new Map();

const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function rateLimitOk(payer: string): boolean {
  const now = Date.now();
  const arr = recentByPayer.get(payer)?.filter((ts) => now - ts < 60_000) ?? [];
  if (arr.length >= RATE_LIMIT_PER_WALLET_PER_MIN) return false;
  arr.push(now);
  recentByPayer.set(payer, arr);
  return true;
}

export async function x402Paywall(req: Request, res: Response, next: NextFunction) {
  const proof = req.header('X-PAYMENT-PROOF');

  if (!proof) {
    const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    res.status(402).json({
      amount: '0.01',
      asset: 'USDC',
      chainId: baseSepolia.id,
      recipient: RECIPIENT,
      nonce,
      expiresAt: Math.floor(Date.now() / 1000) + 300,
    });
    return;
  }

  const txHash = proof.toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(txHash)) {
    res.status(400).json({ error: 'invalid X-PAYMENT-PROOF' });
    return;
  }

  if (usedTxs.has(txHash)) {
    res.status(409).json({ error: 'payment proof already used' });
    return;
  }

  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
    if (!receipt || receipt.status !== 'success') {
      res.status(402).json({ error: 'payment not confirmed' });
      return;
    }

    const transferLog = receipt.logs.find(
      (l) =>
        getAddress(l.address) === getAddress(USDC) &&
        l.topics[0] === ERC20_TRANSFER_TOPIC &&
        l.topics[2] &&
        getAddress(`0x${l.topics[2].slice(26)}`) === getAddress(RECIPIENT),
    );

    if (!transferLog) {
      res.status(402).json({ error: 'no matching USDC transfer' });
      return;
    }

    const amount = BigInt(transferLog.data);
    if (amount < PRICE_USDC) {
      res.status(402).json({ error: 'underpaid' });
      return;
    }

    const payer = transferLog.topics[1] ? getAddress(`0x${transferLog.topics[1].slice(26)}`) : '0x0';
    if (!rateLimitOk(payer)) {
      res.status(429).json({ error: 'rate limited' });
      return;
    }

    usedTxs.add(txHash);
    (req as Request & { x402Payer?: string }).x402Payer = payer;
    next();
  } catch (e) {
    res.status(502).json({ error: 'rpc error', detail: String(e) });
  }
}
