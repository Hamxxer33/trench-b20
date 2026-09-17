import "server-only";

import { NextResponse } from "next/server";
import { BadRequest } from "./validate";
import { NotVerified } from "./verify";

export function ok<T>(data: T, cacheSeconds = 0) {
  const res = NextResponse.json(data);
  if (cacheSeconds > 0) {
    res.headers.set(
      "Cache-Control",
      `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 4}`,
    );
  } else {
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

export function fail(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * One place to turn thrown errors into responses. Validation and verification
 * failures carry their own status; anything else is a 500 with the detail kept
 * server-side so we don't leak RPC or Postgres internals to the browser.
 */
export function handleError(e: unknown) {
  if (e instanceof BadRequest) return fail(e.status, e.message);
  if (e instanceof NotVerified) return fail(e.status, e.message);
  if (e instanceof Error && /Missing (SUPABASE|NEXT_PUBLIC)/.test(e.message)) {
    return fail(503, "Backend is not configured yet");
  }
  console.error("[api]", e);
  return fail(500, "Something went wrong");
}

/**
 * Fixed-window limiter, per IP per route. In-process, so it resets on cold
 * start and does not span Vercel regions — enough to blunt a loop, not a
 * substitute for edge rate limiting on a hostile internet.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: Request, bucket: string, limit = 20, windowMs = 60_000) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();

  if (windows.size > 5_000) {
    for (const [k, v] of windows) if (v.resetAt < now) windows.delete(k);
  }

  const cur = windows.get(key);
  if (!cur || cur.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  cur.count += 1;
  if (cur.count > limit) {
    const retry = Math.ceil((cur.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Slow down" },
      { status: 429, headers: { "Retry-After": String(retry), "Cache-Control": "no-store" } },
    );
  }
  return null;
}
