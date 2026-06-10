"use client";

import { useEffect, useRef } from "react";

// Marks the invite as opened. Link-preview bots (WhatsApp, Telegram, etc.)
// fetch the HTML but never run JS, so a client beacon avoids false opens.
export default function InviteOpenPing({ token }: { token: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) {
      return;
    }
    sent.current = true;

    const payload = JSON.stringify({ token });

    if (navigator.sendBeacon?.("/api/invite-open", payload)) {
      return;
    }

    fetch("/api/invite-open", { method: "POST", body: payload, keepalive: true }).catch(() => {
      // Best-effort: tracking must never affect the guest.
    });
  }, [token]);

  return null;
}
