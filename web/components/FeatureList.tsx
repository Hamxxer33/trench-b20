import Link from "next/link";
import { SoonBadge } from "./ComingSoon";
import { O1_FEATURES } from "@/lib/o1Features";

export function FeatureList({ base = "" }: { base?: string }) {
  const live = O1_FEATURES.filter((f) => f.status === "live");
  const soon = O1_FEATURES.filter((f) => f.status === "soon");
  function href(path?: string) {
    if (!path) return undefined;
    if (path === "/") return base || "/";
    return `${base}${path}`;
  }
  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <h2 className="text-sm font-semibold text-paper">Live now</h2>
        {live.map((f) => {
          const to = href(f.href);
          return (
            <div key={f.title} className="rounded-2xl border border-line bg-panel p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{f.title}</p>
                {to ? (
                  <Link href={to} className="font-mono text-[11px] text-lime">
                    Open
                  </Link>
                ) : (
                  <span className="font-mono text-[10px] uppercase text-lime">Live</span>
                )}
              </div>
              <p className="mt-1 text-sm text-mute">{f.blurb}</p>
            </div>
          );
        })}
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
