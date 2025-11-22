import { Module } from "@nestjs/common"
import { WalletService } from "./wallet.service"
import { WalletController } from "./wallet.controller"
import { UsersModule } from "../users/users.module"
import { AuthModule } from "../auth/auth.module"
import { ComplianceModule } from "../compliance/compliance.module"

@Module({
  imports: [UsersModule, AuthModule, ComplianceModule],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
