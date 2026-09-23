"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function FarcasterReady() {
  useEffect(() => {
    void sdk.actions.ready().catch(() => {
      /* not inside a Farcaster client */
    });
  }, []);
  return null;
}
