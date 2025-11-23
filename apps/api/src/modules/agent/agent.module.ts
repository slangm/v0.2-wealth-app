import { Module } from "@nestjs/common";
import { AgentService } from "./agent.service";
import { AgentController } from "./agent.controller";
import { PortfolioModule } from "../portfolio/portfolio.module";
import { ComplianceModule } from "../compliance/compliance.module";
import { WalletModule } from "../wallet/wallet.module";
import { AuditModule } from "../audit/audit.module";
import { OpenAIAgentService } from "./openai-agent.service";
import { AuthModule } from "../auth/auth.module";
import { DinariModule } from "../dinari/dinari.module";

@Module({
  imports: [
    PortfolioModule,
    ComplianceModule,
    WalletModule,
    AuditModule,
    AuthModule,
    DinariModule,
  ],
  providers: [AgentService, OpenAIAgentService],
  controllers: [AgentController],
})
export class AgentModule {}
