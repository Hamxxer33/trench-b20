export function SoonBadge() {
  return (
    <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-lime">
      Coming soon
    </span>
  );
}

export function ComingSoonCard({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-panel/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{title}</p>
        <SoonBadge />
      </div>
      <p className="mt-1 text-sm text-mute">{blurb}</p>
    </div>
  );
}
