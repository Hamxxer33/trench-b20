import Link from "next/link";
import { SoonBadge } from "@/components/ComingSoon";
import { O1_FEATURES } from "@/lib/o1Features";

export default function MiniMorePage() {
  const live = O1_FEATURES.filter((f) => f.status === "live");
  const soon = O1_FEATURES.filter((f) => f.status === "soon");
  return (
    <div className="grid gap-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime">o1 parity</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Everything on Trench</h1>
        <p className="mt-2 text-sm text-mute">
          Live on Base today, plus the rest of launch.o1.exchange marked Coming soon until we ship it.
        </p>
      </div>

      <section className="grid gap-2">
        <h2 className="text-sm font-semibold text-paper">Live now</h2>
        {live.map((f) => (
          <div key={f.title} className="rounded-2xl border border-line bg-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{f.title}</p>
              {f.href ? (
                <Link href={`/mini${f.href === "/" ? "" : f.href}`} className="font-mono text-[11px] text-lime">
                  Open
                </Link>
              ) : (
                <span className="font-mono text-[10px] uppercase text-lime">Live</span>
              )}
            </div>
            <p className="mt-1 text-sm text-mute">{f.blurb}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-2">
        <h2 className="text-sm font-semibold text-paper">Coming soon</h2>
        {soon.map((f) => (
          <div key={f.title} className="rounded-2xl border border-dashed border-line bg-panel/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{f.title}</p>
              <SoonBadge />
            </div>
            <p className="mt-1 text-sm text-mute">{f.blurb}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
