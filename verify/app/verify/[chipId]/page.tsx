import { Suspense } from 'react';
import { VerifyClient } from './verify-client';

export default function VerifyPage({ params }: { params: { chipId: string } }) {
  return (
    <main className="min-h-dvh bg-tagit-bg text-white px-4 py-6">
      <Suspense fallback={<div className="text-center pt-20">Loading…</div>}>
        <VerifyClient chipId={params.chipId} />
      </Suspense>
    </main>
  );
}
