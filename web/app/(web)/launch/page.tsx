import Link from "next/link";
import { LaunchForm } from "@/components/LaunchForm";

const STEPS = [
  { n: "01", t: "Name it", d: "Name, ticker, logo and links. All of it lands on-chain in the token's profile." },
  { n: "02", t: "Pick the pair", d: "ETH, or one of ten Base stock B20s. That is what buyers spend and what your fees pay out in." },
  { n: "03", t: "Sign once", d: "One transaction mints the token and seeds a Uniswap v4 pool the locker owns forever." },
];

export default function LaunchPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="grid gap-7">
        <header>
          <span className="pill pill-accent">Free · Base gas only</span>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Launch a token</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mute">
            One signature mints an admin-less B20 with 1,000,000,000 supply and seeds a locked pool.
            No presale, no team allocation, no owner keys. You keep 50% of every swap fee.
          </p>
        </header>
        <LaunchForm />
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-24">
        <div className="card p-5">
          <p className="eyebrow mb-4">How it works</p>
          <ol className="grid gap-4">
            {STEPS.map((s) => (
              <li key={s.n} className="grid grid-cols-[auto_1fr] gap-3">
                <span className="tnum text-[11px] text-lime">{s.n}</span>
                <div>
                  <p className="text-[13.5px] font-semibold text-paper">{s.t}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-faint">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-5">
          <p className="eyebrow mb-3">Where the 1% goes</p>
          <div className="grid gap-2 text-[12.5px]">
            <Split label="You, the creator" pct={50} tone="up" />
            <Split label="Platform" pct={30} />
            <Split label="Referrer" pct={20} />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            No referrer on a trade → that 20% goes to the platform. Claim your balance any time from
            your profile.
          </p>
        </div>

        <Link href="/dashboard" className="btn-ghost">
          See what is already live →
        </Link>
      </aside>
    </div>
  );
}

function Split({ label, pct, tone }: { label: string; pct: number; tone?: "up" }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={tone === "up" ? "text-up" : "text-mute"}>{label}</span>
        <span className="tnum text-paper">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel2">
        <div
          className={`h-full rounded-full ${tone === "up" ? "bg-up" : "bg-lime/60"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
