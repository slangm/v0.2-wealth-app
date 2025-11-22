export type PrivyUser = {
  id: string
  email: string
  walletAddress: string
  region: "AR" | "CN" | "TR" | "US"
  riskPreference: "secure-first" | "balanced" | "growth"
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

export async function signInWithEmail(email: string) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  const walletAddress = `0x${stringToHex(email).slice(0, 40).padEnd(40, "0")}`
  session = {
    status: "authenticated",
    user: {
      id: `user_${Date.now()}`,
      email,
      walletAddress,
      region: "AR",
      riskPreference: "balanced",
    },
  }
  emit()
  return session.user
}

export function signOut() {
  session = { status: "unauthenticated" }
  emit()
}

