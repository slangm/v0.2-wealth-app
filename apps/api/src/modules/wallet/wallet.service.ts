import { Injectable } from "@nestjs/common"
import { createHash, randomUUID } from "crypto"
import { UsersService } from "../users/users.service"
import type { WalletRecord, WalletProvider } from "./wallet.entity"
import { ComplianceService } from "../compliance/compliance.service"

const DEFAULT_NETWORK = process.env.AGENT_NETWORK ?? "base-sepolia"

@Injectable()
export class WalletService {
  private readonly wallets = new Map<string, WalletRecord>() // userId -> wallet

  constructor(
    private readonly users: UsersService,
    private readonly compliance: ComplianceService,
  ) {}

  async ensureUserWallet(userId: string) {
    const existing = this.wallets.get(userId)
    if (existing) return existing
    const user = this.users.findById(userId)
    if (!user) {
      throw new Error("User not found")
    }
    const record: WalletRecord = {
      id: randomUUID(),
      userId,
      address: this.generateDeterministicAddress(userId),
      provider: this.pickProvider(),
      network: DEFAULT_NETWORK,
      createdAt: new Date().toISOString(),
    }
    this.wallets.set(userId, record)
    return record
  }

  getWallet(userId: string) {
    return this.wallets.get(userId) ?? null
  }

  listForUser(userId: string) {
    const wallet = this.getWallet(userId)
    return wallet ? [wallet] : []
  }

  canTransact(userId: string) {
    const user = this.users.findById(userId)
    return this.compliance.canExecuteTrades(user)
  }

  private pickProvider(): WalletProvider {
    return process.env.CDP_API_KEY ? "CDP_EMBEDDED" : "LOCAL_FAKE"
  }

  private generateDeterministicAddress(input: string) {
    const hash = createHash("sha256").update(input).digest("hex").slice(0, 40)
    return `0x${hash}`
  }
}
