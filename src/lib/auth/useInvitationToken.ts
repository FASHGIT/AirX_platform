"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getSnapshot() {
  return window.location.hash.match(/(?:^#|&)token=([a-f0-9]{64})/i)?.[1] ?? "";
}

export function useInvitationToken() {
  return useSyncExternalStore(subscribe, getSnapshot, () => "");
}

