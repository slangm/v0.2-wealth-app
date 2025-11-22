import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"

import { PortfolioModule } from "./modules/portfolio/portfolio.module"
import { PaymentsModule } from "./modules/payments/payments.module"
import { AdvisorModule } from "./modules/advisor/advisor.module"
import { HealthModule } from "./modules/health/health.module"
import { AuthModule } from "./modules/auth/auth.module"
import { UsersModule } from "./modules/users/users.module"
import { WalletModule } from "./modules/wallet/wallet.module"
import { AgentModule } from "./modules/agent/agent.module"
import { ComplianceModule } from "./modules/compliance/compliance.module"
import { AuditModule } from "./modules/audit/audit.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    ComplianceModule,
    AuditModule,
    PortfolioModule,
    PaymentsModule,
    AdvisorModule,
    HealthModule,
    WalletModule,
    AgentModule,
  ],
})
export class AppModule {}
