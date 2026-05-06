import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'TAG IT — Tap to Buy',
      preference: 'smartWalletOnly',
    }),
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? 'https://sepolia.base.org'),
  },
});

export const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

export const OFFER_ESCROW_ADDRESS =
  (process.env.NEXT_PUBLIC_OFFER_ESCROW_ADDRESS as `0x${string}` | undefined) ?? '0x0000000000000000000000000000000000000000';
