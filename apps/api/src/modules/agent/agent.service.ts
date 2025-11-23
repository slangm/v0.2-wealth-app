import { Injectable } from "@nestjs/common";
import { PortfolioService } from "../portfolio/portfolio.service";
import { ComplianceService } from "../compliance/compliance.service";
import { WalletService } from "../wallet/wallet.service";
import { AuditService } from "../audit/audit.service";
import type { User } from "../users/user.entity";
import { OpenAIAgentService } from "./openai-agent.service";
import { DinariService } from "../dinari/dinari.service";
import { DinariUserService } from "../dinari/dinari-user.service";

export type AgentAction = {
  type: "swap" | "deposit" | "rebalance" | "advice" | "buy_stock";
  summary: string;
  simulationOnly?: boolean;
  stockSymbol?: string;
  amount?: number;
  preparedId?: string;
  orderRequestId?: string;
  orderId?: string;
};

export type AgentReply = {
  reply: string;
  actions: AgentAction[];
  portfolioSummary: {
    totalNetWorth: number;
    securityBalance: number;
    growthBalance: number;
  };
  compliance: {
    canTrade: boolean;
    region: string;
  };
};

@Injectable()
export class AgentService {
  constructor(
    private readonly portfolio: PortfolioService,
    private readonly compliance: ComplianceService,
    private readonly walletService: WalletService,
    private readonly audit: AuditService,
    private readonly llm: OpenAIAgentService,
    private readonly dinari: DinariService,
    private readonly dinariUser: DinariUserService
  ) {}

  async chat(user: User, message: string): Promise<AgentReply> {
    const snapshot = this.portfolio.getSnapshot();
    const compliance = this.compliance.describe(user);
    const wallet = await this.walletService.ensureUserWallet(user.id);

    // Get user's growth account balance from Dinari
    const growthBalance = await this.dinariUser.getAccountBalance(user.id);

    const llmResult = await this.llm.generate({
      message,
      snapshot,
      compliance,
      wallet,
      growthBalance, // Add growth account balance
      userId: user.id, // Add user ID for tool calls
    });

    // Map tool actions from LLM result (tools are already executed)
    const actions: AgentAction[] =
      llmResult.toolActions?.map<AgentAction>((action: any) => {
        const actionType = action.type || "advice";
        // Validate action type is one of the allowed types
        const validTypes: AgentAction["type"][] = [
          "swap",
          "deposit",
          "rebalance",
          "advice",
          "buy_stock",
        ];
        return {
          type: validTypes.includes(actionType) ? actionType : "advice",
          summary: action.summary ?? action,
          stockSymbol: action.stockSymbol,
          amount: action.amount,
          simulationOnly: action.simulationOnly ?? !compliance.canTrade,
          preparedId: action.preparedId, // From tool execution result
          orderRequestId: action.orderRequestId,
          orderId: action.orderId,
        };
      }) ?? [];

    // Use LLM's original reply text
    let replyText = llmResult.reply || "No response generated.";

    this.audit.record({
      userId: user.id,
      action: "AGENT_CHAT",
      payload: { message, compliance, wallet },
      status: "ok",
    });

    return {
      reply: replyText,
      actions: actions, // Return all original actions from agent
      portfolioSummary: {
        totalNetWorth: snapshot.securityBalance + growthBalance,
        securityBalance: snapshot.securityBalance,
        growthBalance: growthBalance, // Use real balance from Dinari API
      },
      compliance,
    };
  }
}
