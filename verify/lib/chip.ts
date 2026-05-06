/**
 * Resolve a chip ID (NTAG 424 DNA UID) to its bound NFT (contract + tokenId).
 *
 * In production this calls the TAG IT registry (already deployed). For the
 * hackathon demo we read a static map of pre-bound chips from env or a
 * server-side lookup. The chip's SUN signature is verified by the API layer
 * before this resolver is invoked.
 */

export type ChipBinding = {
  chipId: string;
  nft: `0x${string}`;
  tokenId: bigint;
  chain: 'base-sepolia';
};

export async function resolveChip(chipId: string): Promise<ChipBinding | null> {
  const res = await fetch(`/api/resolve?chipId=${encodeURIComponent(chipId)}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { nft: `0x${string}`; tokenId: string } | null;
  if (!data) return null;
  return {
    chipId,
    nft: data.nft,
    tokenId: BigInt(data.tokenId),
    chain: 'base-sepolia',
  };
}
