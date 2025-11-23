import { Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "crypto";
import { UsersService } from "../users/users.service";
import type { WalletRecord, WalletProvider } from "./wallet.entity";
import { ComplianceService } from "../compliance/compliance.service";

const SAFE_NETWORK =
  process.env.SAFE_NETWORK ?? process.env.AGENT_NETWORK ?? "base-sepolia";
const GROWTH_NETWORK = process.env.GROWTH_NETWORK ?? "base-sepolia";

@Injectable()
export class WalletService {
  private readonly wallets = new Map<string, WalletRecord>(); // key: userId:role

  constructor(
    private readonly users: UsersService,
    private readonly compliance: ComplianceService
  ) {}

  async ensureUserWallet(userId: string) {
    const existing = this.getWallet(userId, "safe");
    if (existing) return existing;
    const [safe] = await this.ensureDualWallets(userId);
    return safe;
  }

  async ensureDualWallets(userId: string) {
    const existingSafe = this.getWallet(userId, "safe");
    const existingGrowth = this.getWallet(userId, "growth");
    if (existingSafe && existingGrowth) return [existingSafe, existingGrowth];

    const user = this.users.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const safe: WalletRecord = {
      id: randomUUID(),
      userId,
      role: "safe",
      address: this.generateDeterministicAddress(`${userId}:safe`),
      provider: this.pickProvider(),
      network: SAFE_NETWORK,
      createdAt: new Date().toISOString(),
    };

    const growth: WalletRecord = {
      id: randomUUID(),
      userId,
      role: "growth",
      address: this.generateDeterministicAddress(`${userId}:growth`),
      provider: this.pickProvider(),
      network: GROWTH_NETWORK,
      createdAt: new Date().toISOString(),
    };

    this.wallets.set(this.key(userId, "safe"), safe);
    this.wallets.set(this.key(userId, "growth"), growth);
    return [safe, growth];
  }

  getWallet(userId: string, role: "safe" | "growth" = "safe") {
    return this.wallets.get(this.key(userId, role)) ?? null;
  }

  listForUser(userId: string) {
    const safe = this.getWallet(userId, "safe");
    const growth = this.getWallet(userId, "growth");
    return [safe, growth].filter(Boolean) as WalletRecord[];
  }

  canTransact(userId: string) {
    const user = this.users.findById(userId);
    return this.compliance.canExecuteTrades(user);
  }

  private pickProvider(): WalletProvider {
    return process.env.CDP_API_KEY ? "CDP_EMBEDDED" : "LOCAL_FAKE";
  }

  private generateDeterministicAddress(input: string) {
    const hash = createHash("sha256").update(input).digest("hex").slice(0, 40);
    return `0x${hash}`;
  }

  private key(userId: string, role: "safe" | "growth") {
    return `${userId}:${role}`;
  }
}
