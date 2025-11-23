import { useSyncExternalStore } from "react"

import { getSession, subscribe } from "../services/privy"

export function useSession() {
  return useSyncExternalStore(subscribe, getSession, getSession)
}

