import { Injectable } from "@nestjs/common"
import type { User } from "../users/user.entity"

@Injectable()
export class ComplianceService {
  canExecuteTrades(user: User | null) {
    if (!user) return false
    if (!user.region) return true
    const region = user.region.toUpperCase()
    if (region.startsWith("CN")) {
      return false
    }
    return true
  }

  describe(user: User | null) {
    return {
      canTrade: this.canExecuteTrades(user),
      region: user?.region ?? "unknown",
    }
  }
}
