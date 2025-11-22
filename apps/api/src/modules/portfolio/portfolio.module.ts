import { Module } from "@nestjs/common"
import { PortfolioController } from "./portfolio.controller"
import { PortfolioService } from "./portfolio.service"
import { AuthModule } from "../auth/auth.module"
import { SafeAllocationService } from "./safe-allocation.service"
import { WalletModule } from "../wallet/wallet.module"
import { ComplianceModule } from "../compliance/compliance.module"
import { BeefyService } from "./beefy.service"

@Module({
  imports: [AuthModule, WalletModule, ComplianceModule],
  controllers: [PortfolioController],
  providers: [PortfolioService, SafeAllocationService, BeefyService],
  exports: [PortfolioService, SafeAllocationService, BeefyService],
})
export class PortfolioModule {}
