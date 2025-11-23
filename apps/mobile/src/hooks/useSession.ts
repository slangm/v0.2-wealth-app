import { useEffect, useMemo, useState } from "react"
import { usePrivy } from "@privy-io/expo"
import type { User } from "@privy-io/expo"

type BaseSession = {
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<string | null>
}

type LoadingSession = BaseSession & { status: "loading" }
type UnauthenticatedSession = BaseSession & { status: "unauthenticated" }
type AuthenticatedSession = BaseSession & {
  status: "authenticated"
  user: {
    email: string
    walletAddress?: string
    region: string
    accessToken?: string
  }
}

export type SessionState = LoadingSession | UnauthenticatedSession | AuthenticatedSession

export function useSession(): SessionState {
  const { user, isReady, logout, getAccessToken } = usePrivy()
  const [accessToken, setAccessToken] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    async function hydrateToken() {
      if (!user) {
        setAccessToken(undefined)
        return
      }
      try {
        const token = await getAccessToken()
        if (!cancelled) {
          setAccessToken(token ?? undefined)
        }
      } catch (error) {
        console.warn("Failed to fetch Privy access token", error)
      }
    }
    hydrateToken()
    return () => {
      cancelled = true
    }
  }, [user, getAccessToken])

  const refreshAccessToken = async () => {
    try {
      const token = await getAccessToken()
      setAccessToken(token ?? undefined)
      return token
    } catch (error) {
      console.warn("Failed to refresh Privy access token", error)
      return null
    }
  }

  const normalizedUser = useMemo(() => (user ? mapPrivyUser(user, accessToken) : undefined), [user, accessToken])

  const baseSession: BaseSession = {
    logout: async () => {
      await logout()
      setAccessToken(undefined)
    },
    refreshAccessToken,
  }

  if (!isReady) {
    return { status: "loading", ...baseSession }
  }

  if (!user || !normalizedUser) {
    return { status: "unauthenticated", ...baseSession }
  }

  return {
    status: "authenticated",
    user: normalizedUser,
    ...baseSession,
  }
}

function mapPrivyUser(user: User, accessToken?: string) {
  const email =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((user as any)?.email?.address as string | undefined) ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((user as any)?.google?.email as string | undefined) ??
    user.id

  const walletAddress = extractAddress(user)
  const region =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((user as any)?.country as string | undefined) ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((user as any)?.userInfo?.country as string | undefined) ??
    "global"

  return {
    email,
    walletAddress,
    region,
    accessToken,
  }
}

function extractAddress(user: User): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedAccounts = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user as any)?.linked_accounts ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user as any)?.linkedAccounts ??
    []
  ) as Array<{ address?: string }>
  const fromLinked = linkedAccounts.find((account) => typeof account.address === "string")?.address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const embeddedWalletAddress = (user as any)?.wallet?.address as string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const embeddedWallets = ((user as any)?.embedded_wallets ?? []) as Array<{ address?: string }>
  const fromEmbeddedList = embeddedWallets.find((wallet) => typeof wallet.address === "string")?.address

  return embeddedWalletAddress ?? fromEmbeddedList ?? fromLinked
}

