export type WalletProvider = "CDP_EMBEDDED" | "LOCAL_FAKE"

export type WalletRecord = {
  id: string
  userId: string
  address: string
  provider: WalletProvider
  network: string
  createdAt: string
}
