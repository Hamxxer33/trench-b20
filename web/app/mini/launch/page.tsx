import { LaunchForm } from "@/components/LaunchForm";

export default function MiniLaunchPage() {
  return (
    <div className="grid gap-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime">Create</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Launch a token</h1>
        <p className="mt-2 text-sm text-mute">
          One signature in your Farcaster wallet. Native B20, 1B supply, LP locked. Pair ETH or a stock.
        </p>
      </div>
      <LaunchForm />
    </div>
  );
}
