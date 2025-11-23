type CoinbaseSession =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | {
      status: "authenticated"
      user: {
        email: string
        accessToken: string
        safeWallet?: string
        growthWallet?: string
      }
    }

let session: CoinbaseSession = { status: "loading" }
const subscribers = new Set<() => void>()

function emit() {
  subscribers.forEach((listener) => listener())
}

export function subscribe(listener: () => void) {
  subscribers.add(listener)
  return () => subscribers.delete(listener)
}

export function getSession() {
  return session
}

export async function bootstrapSession() {
  if (session.status === "loading") {
    session = { status: "unauthenticated" }
    emit()
  }
}

export async function signInWithCoinbase(email: string) {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL
  if (!apiBase) throw new Error("Missing API base URL")

  const resp = await fetch(`${apiBase}/auth/coinbase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })

  if (!resp.ok) throw new Error("Coinbase auth failed")

  const data = await resp.json()

  session = {
    status: "authenticated",
    user: {
      email,
      accessToken: data.accessToken,
      safeWallet: data.safeWallet,
      growthWallet: data.growthWallet,
    },
  }
  emit()
  return session.user
}

export function signOut() {
  session = { status: "unauthenticated" }
  emit()
}
