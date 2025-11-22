import { Controller, Get, Post, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/jwt.guard"
import { CurrentUser } from "../auth/current-user.decorator"
import type { User } from "../users/user.entity"
import { WalletService } from "./wallet.service"

@Controller("wallets")
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  async create(@CurrentUser() user: User) {
    const [safeWallet, growthWallet] = await this.walletService.ensureDualWallets(user.id)
    return { safeWallet, growthWallet }
  }

  @Get("me")
  async me(@CurrentUser() user: User) {
    const [safeWallet, growthWallet] = await this.walletService.ensureDualWallets(user.id)
    return { safeWallet, growthWallet, canTransact: this.walletService.canTransact(user.id) }
  }
}
