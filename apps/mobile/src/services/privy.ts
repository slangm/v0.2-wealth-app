export type PrivyUser = {
  id: string
  email: string
  walletAddress: string
  region: "AR" | "CN" | "TR" | "US"
  riskPreference: "secure-first" | "balanced" | "growth"
  accessToken?: string
  safeWallet?: string
  growthWallet?: string
}

export type PrivySession =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: PrivyUser }

let session: PrivySession = { status: "loading" }
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

export async function bootstrapPrivy() {
  if (session.status === "loading") {
    session = { status: "unauthenticated" }
    emit()
  }
}

function stringToHex(input: string) {
  return input
    .split("")
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
}

async function backendLogin(email: string) {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL
  if (!apiBase) return null
  try {
    const loginResp = await fetch(`${apiBase}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: email, region: "US" }),
    })
    if (!loginResp.ok) throw new Error("auth failed")
    const loginJson = await loginResp.json()
    const token = loginJson.tokens?.accessToken as string | undefined
    if (!token) return null

    const walletsResp = await fetch(`${apiBase}/wallets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const walletsJson = walletsResp.ok ? await walletsResp.json() : {}
    const safeWallet = walletsJson.safeWallet?.address as string | undefined
    const growthWallet = walletsJson.growthWallet?.address as string | undefined

    return { token, safeWallet, growthWallet }
  } catch (error) {
    console.warn("Backend bootstrap failed", error)
    return null
  }
}

export async function signInWithEmail(email: string) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  const walletAddress = `0x${stringToHex(email).slice(0, 40).padEnd(40, "0")}`
  const user: PrivyUser = {
    id: `user_${Date.now()}`,
    email,
    walletAddress,
    region: "US",
    riskPreference: "balanced",
  }

  // Try backend login + wallet bootstrap
  try {
    const backend = await backendLogin(email)
    user.accessToken = backend?.token
    user.safeWallet = backend?.safeWallet
    user.growthWallet = backend?.growthWallet
  } catch (err) {
    console.warn("Backend login failed, staying local", err)
  }

  session = {
    status: "authenticated",
    user,
  }
  emit()
  return user
}

export function signOut() {
  session = { status: "unauthenticated" }
  emit()
}
