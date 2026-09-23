import { FeatureList } from "@/components/FeatureList";

export default function MorePage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime">o1 parity</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Everything on Trench</h1>
        <p className="mt-2 text-sm text-mute">
          Live on Base today, plus the rest of launch.o1.exchange marked Coming soon until we ship it.
        </p>
      </div>
      <FeatureList />
    </div>
  );
}
