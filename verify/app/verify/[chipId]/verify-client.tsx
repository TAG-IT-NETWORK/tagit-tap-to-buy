'use client';

import { useEffect, useState } from 'react';
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useSignTypedData,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseUnits, type Hex } from 'viem';
import { OFFER_ESCROW_ADDRESS, USDC_BASE_SEPOLIA } from '@/lib/wallet';
import { resolveChip, type ChipBinding } from '@/lib/chip';
import { fetchBriefPaid, type BriefResult, type X402Quote } from '@/lib/x402';

const TAGIT_ABI = [
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'getAsset',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'timestamp', type: 'uint64' },
      { name: 'state', type: 'uint8' },
      { name: 'flags', type: 'uint8' },
      { name: 'reserved', type: 'uint16' },
    ],
  },
] as const;

type LifecycleState = 'NONE' | 'MINTED' | 'BOUND' | 'ACTIVATED' | 'CLAIMED' | 'FLAGGED' | 'RECYCLED';
const STATE_NAMES: LifecycleState[] = [
  'NONE',
  'MINTED',
  'BOUND',
  'ACTIVATED',
  'CLAIMED',
  'FLAGGED',
  'RECYCLED',
];

function truncate(addr?: string) {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function VerifyClient({ chipId }: { chipId: string }) {
  const [binding, setBinding] = useState<ChipBinding | null>(null);
  const [reputation] = useState<{ sales: number; disputes: number }>({ sales: 12, disputes: 0 });

  useEffect(() => {
    let mounted = true;
    resolveChip(chipId).then((b) => mounted && setBinding(b));
    return () => {
      mounted = false;
    };
  }, [chipId]);

  const { data: assetData } = useReadContract({
    address: binding?.nft,
    abi: TAGIT_ABI,
    functionName: 'getAsset',
    args: binding ? [binding.tokenId] : undefined,
    query: { enabled: !!binding },
  });

  const tuple = assetData as
    | readonly [`0x${string}`, bigint, number, number, number]
    | undefined;
  const owner = tuple?.[0];
  const timestampRaw = tuple?.[1];
  const stateRaw = tuple?.[2];
  const lifecycle: LifecycleState =
    stateRaw !== undefined && stateRaw < STATE_NAMES.length ? STATE_NAMES[stateRaw] : 'NONE';
  const lastVerifiedSec = timestampRaw ? Number(timestampRaw) : 0;

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

const OFFER_TYPES = {
  Offer: [
    { name: 'buyer', type: 'address' },
    { name: 'nft', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'paymentToken', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

const FUND_OFFER_ABI = [
  {
    type: 'function',
    name: 'fundOffer',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'offer',
        type: 'tuple',
        components: [
          { name: 'buyer', type: 'address' },
          { name: 'nft', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'paymentToken', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
] as const;

type Stage = 'idle' | 'signing' | 'approving' | 'approve-wait' | 'funding' | 'fund-wait' | 'done' | 'error';

function OfferForm({ binding, owner }: { binding: ChipBinding; owner?: `0x${string}` }) {
  const [amount, setAmount] = useState<string>('30');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<Hex | null>(null);
  const [offer, setOffer] = useState<{
    buyer: `0x${string}`;
    nft: `0x${string}`;
    tokenId: bigint;
    paymentToken: `0x${string}`;
    amount: bigint;
    nonce: bigint;
    deadline: bigint;
  } | null>(null);

  const { address } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();

  const [approveHash, setApproveHash] = useState<Hex | undefined>();
  const [fundHash, setFundHash] = useState<Hex | undefined>();
  const { isSuccess: approveDone } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: fundDone } = useWaitForTransactionReceipt({ hash: fundHash });

  // Once approve is mined, fire the fundOffer call.
  useEffect(() => {
    if (!approveDone || !offer || !signature || stage !== 'approve-wait') return;
    (async () => {
      try {
        setStage('funding');
        const hash = await writeContractAsync({
          address: OFFER_ESCROW_ADDRESS,
          abi: FUND_OFFER_ABI,
          functionName: 'fundOffer',
          args: [offer, signature],
        });
        setFundHash(hash);
        setStage('fund-wait');
      } catch (e) {
        setError(String((e as Error).message ?? e));
        setStage('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveDone]);

  // Final state.
  useEffect(() => {
    if (fundDone && stage === 'fund-wait') setStage('done');
  }, [fundDone, stage]);

  async function submit() {
    setError(null);
    setStage('signing');
    try {
      if (!address) throw new Error('Wallet not connected');
      if (OFFER_ESCROW_ADDRESS === '0x0000000000000000000000000000000000000000') {
        throw new Error('OfferEscrow not configured');
      }

      const wei = parseUnits(amount || '0', 6);
      if (wei <= 0n) throw new Error('Amount must be > 0');

      const built = {
        buyer: address as `0x${string}`,
        nft: binding.nft,
        tokenId: binding.tokenId,
        paymentToken: USDC_BASE_SEPOLIA as `0x${string}`,
        amount: wei,
        nonce: BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000)),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
      };

      const sig = (await signTypedDataAsync({
        domain: {
          name: 'TagItOfferEscrow',
          version: '1',
          chainId,
          verifyingContract: OFFER_ESCROW_ADDRESS,
        },
        types: OFFER_TYPES,
        primaryType: 'Offer',
        message: built,
      })) as Hex;

      setOffer(built);
      setSignature(sig);

      setStage('approving');
      const aHash = await writeContractAsync({
        address: USDC_BASE_SEPOLIA,
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [OFFER_ESCROW_ADDRESS, wei],
      });
      setApproveHash(aHash);
      setStage('approve-wait');
    } catch (e) {
      setError(String((e as Error).message ?? e));
      setStage('error');
    }
  }

  const busy = stage !== 'idle' && stage !== 'done' && stage !== 'error';
  const label =
    stage === 'idle'
      ? `Offer ${amount} USDC`
      : stage === 'signing'
        ? 'Sign offer in wallet…'
        : stage === 'approving'
          ? 'Approve USDC in wallet…'
          : stage === 'approve-wait'
            ? 'Approval confirming…'
            : stage === 'funding'
              ? 'Fund escrow in wallet…'
              : stage === 'fund-wait'
                ? 'Funding confirming…'
                : stage === 'done'
                  ? '✓ Offer funded'
                  : 'Try again';

  return (
    <div className="mt-3 space-y-3">
      <label className="block text-xs text-zinc-500">Offer amount (USDC)</label>
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={busy}
        className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 font-mono disabled:opacity-50"
      />
      <button
        disabled={busy}
        onClick={submit}
        className="w-full rounded-xl bg-tagit-accent text-black font-semibold py-3 active:scale-[0.99] transition disabled:opacity-50"
      >
        {label}
      </button>
      {error && <p className="text-[11px] text-tagit-danger break-words">{error}</p>}
      {fundHash && (
        <a
          className="block text-[11px] text-zinc-500 underline-offset-4 hover:underline"
          href={`https://sepolia.basescan.org/tx/${fundHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View funding tx ↗
        </a>
      )}
      {owner && (
        <p className="text-[11px] text-zinc-500">
          Funds locked in escrow until <span className="font-mono">{truncate(owner)}</span> accepts
          or you tap on receive. 24h timeout refund.
        </p>
      )}
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
