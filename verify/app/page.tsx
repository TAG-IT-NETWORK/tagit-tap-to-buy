export default function Home() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">TAG IT — Tap to Buy</h1>
        <p className="text-zinc-400">
          Tap any TAG IT chip to verify physical authenticity, see history, and transact on-chain in seconds.
        </p>
        <p className="text-xs text-zinc-600">
          Visit <code>/verify/&lt;chipId&gt;</code> after a tap.
        </p>
      </div>
    </main>
  );
}
