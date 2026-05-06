/**
 * x402 client helper — issues a paid request to the brief endpoint.
 * On 402 response, surfaces a payment requirement that the wagmi client
 * fulfills with a 0.01 USDC transfer, then retries with the proof header.
 */

export type X402Quote = {
  amount: string; // "0.01"
  asset: 'USDC';
  chainId: number;
  recipient: `0x${string}`;
  nonce: string;
  expiresAt: number;
};

export type BriefResult = {
  productName: string;
  msrp?: string;
  condition: string;
  custodyHistory: { address: `0x${string}`; ts: number }[];
  scanCount: number;
  recallFlags: string[];
  imageUrl: string;
  brief: string;
};

export async function fetchBriefPaid(
  chipId: string,
  paymentProof?: string,
): Promise<{ brief: BriefResult } | { quote: X402Quote }> {
  const res = await fetch(`/api/getBrief?chipId=${encodeURIComponent(chipId)}`, {
    headers: paymentProof ? { 'X-PAYMENT-PROOF': paymentProof } : undefined,
  });
  if (res.status === 402) {
    const quote = (await res.json()) as X402Quote;
    return { quote };
  }
  if (!res.ok) throw new Error(`brief fetch failed: ${res.status}`);
  const brief = (await res.json()) as BriefResult;
  return { brief };
}
