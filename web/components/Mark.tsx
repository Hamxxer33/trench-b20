export function PadMark({ size = 32 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.jpg"
      alt="Trench"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded-lg object-cover"
    />
  );
}

export function TokenMark({ address, src, size = 44 }: { address: string; src?: string; size?: number }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover bg-ink"
      />
    );
  }
  const a = Number.parseInt(address.slice(2, 8) || "1", 16);
  const b = Number.parseInt(address.slice(8, 14) || "2", 16);
  const c1 = `hsl(${a % 360} 70% 48%)`;
  const c2 = `hsl(${(b * 3) % 360} 55% 28%)`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="rounded-full">
      <defs>
        <linearGradient id={`g-${address.slice(2, 8)}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" fill={`url(#g-${address.slice(2, 8)})`} />
    </svg>
  );
}
