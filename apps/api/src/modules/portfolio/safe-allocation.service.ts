import { Injectable, BadRequestException } from "@nestjs/common"
import { encodeFunctionData, parseUnits } from "viem"
import { CdpWalletProvider } from "@coinbase/agentkit"
import { WalletService } from "../wallet/wallet.service"
import { ComplianceService } from "../compliance/compliance.service"
import type { User } from "../users/user.entity"

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const

const AAVE_POOL_ABI = [
  {
    name: "supply",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    outputs: [],
  },
] as const

const SAFE_TOKEN_ADDRESS = (process.env.SAFE_UNDERLYING_TOKEN ?? "0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913").toLowerCase()
const SAFE_TOKEN_DECIMALS = Number(process.env.SAFE_TOKEN_DECIMALS ?? 6)
const AAVE_ADDRESS_PROVIDER = (process.env.AAVE_ADDRESS_PROVIDER ?? "0xE0E605aBD2d9F674450B12364417ae0F0F5A985a").toLowerCase()
const SAFE_NETWORK = process.env.SAFE_NETWORK ?? "base-mainnet"

const ADDRESS_PROVIDER_ABI = [
  {
    name: "getPool",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const

@Injectable()
export class SafeAllocationService {
  constructor(
    private readonly walletService: WalletService,
    private readonly complianceService: ComplianceService,
  ) {}

  async allocateSafe(user: User, amount: number) {
    if (!this.complianceService.canExecuteTrades(user)) {
      throw new BadRequestException("Region not allowed for onchain actions")
    }
    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive")
    }

    const [safeWallet] = await this.walletService.ensureDualWallets(user.id)
    if (safeWallet.network !== SAFE_NETWORK) {
      throw new BadRequestException(`Safe wallet network mismatch: ${safeWallet.network} (expected ${SAFE_NETWORK})`)
    }

    const depositPct = 0.9
    const holdPct = 0.1
    const depositAmount = amount * depositPct
    const holdAmount = amount * holdPct

    const depositAmountWei = parseUnits(depositAmount.toFixed(SAFE_TOKEN_DECIMALS), SAFE_TOKEN_DECIMALS)

    const walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
      networkId: SAFE_NETWORK,
      address: safeWallet.address,
    })

    const poolAddress = (await walletProvider.readContract({
      address: AAVE_ADDRESS_PROVIDER as `0x${string}`,
      abi: ADDRESS_PROVIDER_ABI,
      functionName: "getPool",
      args: [],
    })) as `0x${string}`

    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [poolAddress, depositAmountWei],
    })

    const approveTxHash = await walletProvider.sendTransaction({
      to: SAFE_TOKEN_ADDRESS as `0x${string}`,
      data: approveData,
      value: 0n,
    })

    const supplyData = encodeFunctionData({
      abi: AAVE_POOL_ABI,
      functionName: "supply",
      args: [SAFE_TOKEN_ADDRESS as `0x${string}`, depositAmountWei, walletProvider.getAddress() as `0x${string}`, 0],
    })

    const supplyTxHash = await walletProvider.sendTransaction({
      to: poolAddress,
      data: supplyData,
      value: 0n,
    })

    return {
      depositAmount,
      holdAmount,
      approveTxHash,
      supplyTxHash,
      network: SAFE_NETWORK,
      token: SAFE_TOKEN_ADDRESS,
      pool: poolAddress,
      addressProvider: AAVE_ADDRESS_PROVIDER,
    }
  }
}
