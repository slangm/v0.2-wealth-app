import { apiGet, apiPost } from "./api-client"

export type BeefyVault = {
  id: string
  name: string
  chain: string
  status: string
  token: string
  tokenAddress: string
  earnContractAddress: string
  apy: number | null
  assets?: string[]
  platformId?: string
}

export function fetchBeefyVaults(token?: string) {
  return apiGet<BeefyVault[]>("/portfolio/beefy/vaults", token)
}

export function mockBeefyDeposit(vaultId: string, amount: number, token?: string) {
  return apiPost("/portfolio/beefy/deposit", { vaultId, amount }, token)
}
