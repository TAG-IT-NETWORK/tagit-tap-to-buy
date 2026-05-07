import { NextRequest, NextResponse } from 'next/server';

/**
 * Chip → asset binding resolver.
 *
 * Hackathon demo uses a static map. Production wires this to the TAG IT
 * registry on-chain or a DynamoDB cache. Any chipId resolves to the demo
 * asset (token #5 on Base Sepolia TAGITCore) so judges can tap any chip
 * and land on the live demo.
 */

const DEMO_BINDING = {
  nft: '0x3aDc7EFDb58Ae85483eFf5D4966D916185f31d1D' as const,
  tokenId: '5',
};

const STATIC_MAP: Record<string, { nft: `0x${string}`; tokenId: string }> = {
  // Demo chip on the VT PDRN cream jar (any chipId resolves to this for demo).
  // Add real chip-UID mappings here as more products get bound.
};

export async function GET(req: NextRequest) {
  const chipId = req.nextUrl.searchParams.get('chipId') ?? '';
  if (!chipId || !/^[a-zA-Z0-9_-]{1,64}$/.test(chipId)) {
    return NextResponse.json({ error: 'invalid chipId' }, { status: 400 });
  }

  const binding = STATIC_MAP[chipId] ?? DEMO_BINDING;

  return NextResponse.json(binding, {
    headers: { 'Cache-Control': 'public, max-age=30' },
  });
}
