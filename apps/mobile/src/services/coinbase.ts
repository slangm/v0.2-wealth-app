import { apiPost } from "./api-client"

const COINBASE_API_KEY_NAME = process.env.EXPO_PUBLIC_CDP_API_KEY_NAME

export type CoinbaseLoginPayload = {
  email: string
}

export async function initiateCoinbaseLogin(payload: CoinbaseLoginPayload) {
  if (!COINBASE_API_KEY_NAME) {
    throw new Error("Coinbase credentials missing. Set EXPO_PUBLIC_CDP_API_KEY_NAME.")
  }

  // In production this will hit our backend which talks to Coinbase CDP.
  return apiPost("/auth/coinbase", {
    ...payload,
    apiKeyName: COINBASE_API_KEY_NAME,
  })
}

