import Link from "next/link";
import { BASESCAN, FACTORY, ROUTER, ZERO } from "@/lib/addresses";
import { shortAddr } from "@/lib/format";

export function Footer() {
  const deployed = FACTORY !== ZERO;

  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-[84rem] gap-6 px-4 py-9 sm:grid-cols-[1fr_auto] sm:px-6">
        <div>
          <p className="font-display text-[15px]">Trench</p>
          <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-faint">
            Admin-less B20 tokens on Base with permanently locked Uniswap v4 liquidity. Unaudited —
            use at your own risk, and never spend more than you can lose.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-[12.5px] sm:justify-end">
          <Link className="text-mute hover:text-paper" href="/dashboard">
            Board
          </Link>
          <Link className="text-mute hover:text-paper" href="/launch">
            Launch
          </Link>
          {deployed && (
            <>
              <a
                className="text-mute hover:text-paper"
                href={`${BASESCAN}/address/${FACTORY}`}
                target="_blank"
                rel="noreferrer"
              >
                Factory {shortAddr(FACTORY)}
              </a>
              <a
                className="text-mute hover:text-paper"
                href={`${BASESCAN}/address/${ROUTER}`}
                target="_blank"
                rel="noreferrer"
              >
                Router {shortAddr(ROUTER)}
              </a>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
