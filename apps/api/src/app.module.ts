import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"

import { PortfolioModule } from "./modules/portfolio/portfolio.module"
import { PaymentsModule } from "./modules/payments/payments.module"
import { AdvisorModule } from "./modules/advisor/advisor.module"
import { HealthModule } from "./modules/health/health.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PortfolioModule,
    PaymentsModule,
    AdvisorModule,
    HealthModule,
  ],
})
export class AppModule {}

