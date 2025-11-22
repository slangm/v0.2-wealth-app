import { Injectable, BadRequestException } from "@nestjs/common"

const WHITELIST = ["mooAaveUSDCv3", "mooBalancerMaticX-wMATIC", "mooQuickQMATIC-wETH"]
const VAULTS_URL = "https://api.beefy.finance/vaults"
const APY_URL = "https://api.beefy.finance/apy"

type BeefyVault = {
  id: string
  name: string
  token: string
  chain: string
  status: string
  tokenAddress: string
  earnContractAddress: string
  assets?: string[]
  platformId?: string
}

@Injectable()
export class BeefyService {
  private cache: { data: any; ts: number } | null = null
  private cacheMs = 1000 * 60 // 1 min

  async listWhitelisted() {
    const now = Date.now()
    if (this.cache && now - this.cache.ts < this.cacheMs) {
      return this.cache.data
    }

    const [vaultsResp, apyResp] = await Promise.all([fetch(VAULTS_URL), fetch(APY_URL)])
    if (!vaultsResp.ok || !apyResp.ok) {
      throw new Error("Failed to fetch Beefy API")
    }
    const vaultsJson = (await vaultsResp.json()) as BeefyVault[]
    const apyJson = (await apyResp.json()) as Record<string, number>

    const filtered = vaultsJson
      .filter((v) => WHITELIST.includes(v.id))
      .map((v) => ({
        id: v.id,
        name: v.name,
        chain: v.chain,
        status: v.status,
        token: v.token,
        tokenAddress: v.tokenAddress,
        earnContractAddress: v.earnContractAddress,
        assets: v.assets,
        platformId: v.platformId,
        apy: apyJson[v.id] ?? null,
      }))

    this.cache = { data: filtered, ts: now }
    return filtered
  }

  assertWhitelisted(vaultId: string) {
    if (!WHITELIST.includes(vaultId)) {
      throw new BadRequestException("Vault not allowed")
    }
  }
}
