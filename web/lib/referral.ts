"use client";

import { type Address, isAddress } from "viem";
import { ZERO } from "./addresses";

const KEY = "trench.ref";
const TOKEN_KEY = "trench.ref.token";

export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");
  const token = url.searchParams.get("token");
  if (ref && isAddress(ref)) {
    if (token && isAddress(token)) {
      sessionStorage.setItem(`${TOKEN_KEY}.${token.toLowerCase()}`, ref);
    }
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, ref);
  }
}

export function referralFor(token?: Address): Address {
  if (typeof window === "undefined") return ZERO;
  if (token) {
    const specific = sessionStorage.getItem(`${TOKEN_KEY}.${token.toLowerCase()}`);
    if (specific && isAddress(specific)) return specific as Address;
  }
  const global = localStorage.getItem(KEY);
  if (global && isAddress(global)) return global as Address;
  return ZERO;
}

export function referralLink(origin: string, account: Address, token?: Address) {
  const url = new URL(origin);
  if (token) {
    url.pathname = `/token/${token}`;
    url.searchParams.set("token", token);
  } else {
    url.pathname = "/";
  }
  url.searchParams.set("ref", account);
  return url.toString();
}
