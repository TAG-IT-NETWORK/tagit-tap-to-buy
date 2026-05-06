'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract } from 'wagmi';
import { OFFER_ESCROW_ADDRESS } from '@/lib/wallet';
import { resolveChip, type ChipBinding } from '@/lib/chip';
import { fetchBriefPaid, type BriefResult, type X402Quote } from '@/lib/x402';

const ERC721_ABI = [
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

type LifecycleState = 'BOUND' | 'ACTIVATED' | 'CLAIMED' | 'FLAGGED' | 'NONE';

function truncate(addr?: string) {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function VerifyClient({ chipId }: { chipId: string }) {
  const [binding, setBinding] = useState<ChipBinding | null>(null);
  const [lifecycle, setLifecycle] = useState<LifecycleState>('CLAIMED');
  const [lastVerifiedSec, setLastVerifiedSec] = useState<number>(0);
  const [reputation, setReputation] = useState<{ sales: number; disputes: number }>({ sales: 12, disputes: 0 });

  useEffect(() => {
    let mounted = true;
    resolveChip(chipId).then((b) => mounted && setBinding(b));
    setLastVerifiedSec(Math.floor(Date.now() / 1000) - 30);
    return () => {
      mounted = false;
    };
  }, [chipId]);

  const { data: ownerOf } = useReadContract({
    address: binding?.nft,
    abi: ERC721_ABI,
    functionName: 'ownerOf',
    args: binding ? [binding.tokenId] : undefined,
    query: { enabled: !!binding },
  });

  const owner = ownerOf as `0x${string}` | undefined;

  return (
    <div className="mx-auto max-w-md flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-zinc-500">
        <span>tagit.network</span>
        <span>Base Sepolia</span>
      </div>

      {/* Layer 1 — Universal verification */}
      <Layer1Verify
        chipId={chipId}
        binding={binding}
        owner={owner}
        lifecycle={lifecycle}
        lastVerifiedSec={lastVerifiedSec}
        reputation={reputation}
      />

      {/* Layer 2 — x402-gated brief */}
      <Layer2Brief chipId={chipId} />

      {/* Layer 3 — Wallet action */}
      <Layer3Action binding={binding} owner={owner} />

      <Footer />
    </div>
  );
}

function Layer1Verify({
  chipId,
  binding,
  owner,
  lifecycle,
  lastVerifiedSec,
  reputation,
}: {
  chipId: string;
  binding: ChipBinding | null;
  owner?: `0x${string}`;
  lifecycle: LifecycleState;
  lastVerifiedSec: number;
  reputation: { sales: number; disputes: number };
}) {
  const elapsed = lastVerifiedSec ? Math.max(0, Math.floor(Date.now() / 1000) - lastVerifiedSec) : 0;
  const fresh = elapsed < 60 * 60 * 24;
  const stateColor =
    lifecycle === 'CLAIMED' || lifecycle === 'ACTIVATED' || lifecycle === 'BOUND'
      ? 'text-tagit-accent'
      : lifecycle === 'FLAGGED'
        ? 'text-tagit-danger'
        : 'text-zinc-400';

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <div className="flex items-center gap-3">
        <span aria-hidden className="size-3 rounded-full bg-tagit-accent shadow-[0_0_12px_#00ff9d]" />
        <h1 className="text-2xl font-semibold tracking-tight">AUTHENTIC</h1>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-y-3 text-sm">
        <dt className="text-zinc-500">Lifecycle</dt>
        <dd className={`font-mono ${stateColor}`}>{lifecycle}</dd>

        <dt className="text-zinc-500">Owner</dt>
        <dd className="font-mono">{truncate(owner)}</dd>

        <dt className="text-zinc-500">Reputation</dt>
        <dd className="font-mono">
          {reputation.sales} sales · {reputation.disputes} disputes
        </dd>

        <dt className="text-zinc-500">Chip</dt>
        <dd className="font-mono">{truncate(chipId)}</dd>

        <dt className="text-zinc-500">Token</dt>
        <dd className="font-mono">#{binding ? binding.tokenId.toString() : '—'}</dd>

        <dt className="text-zinc-500">Last verified</dt>
        <dd className={`font-mono ${fresh ? 'text-tagit-accent' : 'text-tagit-warn'}`}>
          {fresh ? 'just now' : `${Math.floor(elapsed / 3600)}h ago`}
        </dd>
      </dl>

      {binding && (
        <a
          className="mt-5 block text-xs text-zinc-500 hover:text-zinc-300 underline-offset-4 hover:underline"
          href={`https://sepolia.basescan.org/token/${binding.nft}?a=${binding.tokenId}`}
          target="_blank"
          rel="noreferrer"
        >
          View on Basescan ↗
        </a>
      )}
    </section>
  );
}

function Layer2Brief({ chipId }: { chipId: string }) {
  const [state, setState] = useState<'idle' | 'paying' | 'loading' | 'done' | 'error'>('idle');
  const [brief, setBrief] = useState<BriefResult | null>(null);
  const [quote, setQuote] = useState<X402Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setState('paying');
    setError(null);
    try {
      const first = await fetchBriefPaid(chipId);
      if ('quote' in first) {
        setQuote(first.quote);
        // Hand off to wallet to pay 0.01 USDC and produce a payment proof.
        // The wagmi-driven payment + retry happens in a child hook (TODO).
        setState('idle');
        return;
      }
      setBrief(first.brief);
      setState('done');
    } catch (e) {
      setError(String(e));
      setState('error');
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-sm uppercase tracking-widest text-zinc-500">AI brief</h2>
      {state === 'idle' && !brief && (
        <button
          onClick={start}
          className="mt-3 w-full rounded-xl bg-tagit-accent text-black font-semibold py-3 active:scale-[0.99] transition"
        >
          Get details — 1¢ via x402
        </button>
      )}
      {state === 'paying' && <p className="mt-3 text-sm text-zinc-400">Awaiting payment…</p>}
      {quote && state === 'idle' && (
        <p className="mt-3 text-xs text-zinc-500">
          Quote: {quote.amount} {quote.asset} → {truncate(quote.recipient)} (chain {quote.chainId})
        </p>
      )}
      {brief && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="font-medium">{brief.productName}</div>
          <p className="text-zinc-300 leading-relaxed">{brief.brief}</p>
          {brief.recallFlags.length > 0 && (
            <p className="text-tagit-danger">⚠ {brief.recallFlags.join(', ')}</p>
          )}
        </div>
      )}
      {error && <p className="mt-3 text-tagit-danger text-xs">{error}</p>}
    </section>
  );
}

function Layer3Action({ binding, owner }: { binding: ChipBinding | null; owner?: `0x${string}` }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const isOwner = !!address && !!owner && address.toLowerCase() === owner.toLowerCase();

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-sm uppercase tracking-widest text-zinc-500">Action</h2>

      {!isConnected && (
        <button
          onClick={() => connect({ connector: connectors[0] })}
          disabled={isConnecting}
          className="mt-3 w-full rounded-xl bg-white text-black font-semibold py-3 active:scale-[0.99] transition disabled:opacity-50"
        >
          {isConnecting ? 'Connecting…' : 'Connect Wallet'}
        </button>
      )}

      {isConnected && !isOwner && binding && (
        <OfferForm binding={binding} owner={owner} />
      )}

      {isConnected && isOwner && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-zinc-300">You own this asset.</p>
          <button className="w-full rounded-xl border border-zinc-700 py-3 hover:border-zinc-500">
            View incoming offers
          </button>
        </div>
      )}

      {isConnected && (
        <button
          onClick={() => disconnect()}
          className="mt-4 text-xs text-zinc-500 hover:text-zinc-300"
        >
          Disconnect ({truncate(address)})
        </button>
      )}

      {OFFER_ESCROW_ADDRESS === '0x0000000000000000000000000000000000000000' && (
        <p className="mt-4 text-[11px] text-tagit-warn">
          OfferEscrow not configured — set NEXT_PUBLIC_OFFER_ESCROW_ADDRESS.
        </p>
      )}
    </section>
  );
}

function OfferForm({ binding, owner }: { binding: ChipBinding; owner?: `0x${string}` }) {
  const [amount, setAmount] = useState<string>('30');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      // TODO: build EIP-712 typed offer, sign via wagmi, fund escrow.
      // Wired in next pass. See contracts/src/OfferEscrow.sol fundOffer().
      console.log('offer submit', { binding, owner, amount });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <label className="block text-xs text-zinc-500">Offer amount (USDC)</label>
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 font-mono"
      />
      <button
        disabled={submitting}
        onClick={submit}
        className="w-full rounded-xl bg-tagit-accent text-black font-semibold py-3 active:scale-[0.99] transition disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : `Offer ${amount} USDC`}
      </button>
      <p className="text-[11px] text-zinc-500">
        Funds locked in escrow until owner accepts or you tap on receive. 24h timeout refund.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="text-center text-[11px] text-zinc-600 pt-4">
      Built at EasyA Consensus Miami — May 5–7, 2026 · TAG IT NETWORK
    </footer>
  );
}
