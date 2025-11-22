import { useSyncExternalStore } from "react"

import { getSession, subscribe } from "../services/privy"

export function usePrivySession() {
  return useSyncExternalStore(subscribe, getSession, getSession)
}

