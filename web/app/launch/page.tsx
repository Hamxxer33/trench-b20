import { LaunchForm } from "@/components/LaunchForm";

export default function LaunchPage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-8 pt-2">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime">Create</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Launch a token</h1>
        <p className="mt-3 text-mute">
          One signature. Native B20, 1B supply, liquidity locked. Free to launch — Base gas only. After launch,
          1% of every trade splits 50 / 30 / 20.
        </p>
      </div>
      <LaunchForm />
    </div>
  );
}
