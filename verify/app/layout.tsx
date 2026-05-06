import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'TAG IT — Tap to Buy',
  description: 'Physical truth for AI commerce. Tap, verify, transact, settle.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'TAG IT — Tap to Buy',
    description: 'Physical truth for AI commerce.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
