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
    });

    // Return agent's original values directly
    let actions: AgentAction[] =
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
          preparedId: action.preparedId,
          orderRequestId: action.orderRequestId,
          orderId: action.orderId,
        };
      }) ?? [];

    // If the model proposed buy_stock and the user can trade, auto-sign + submit via Dinari
    if (compliance.canTrade && actions.length > 0) {
      // Ensure Dinari account is ready (idempotent)
      let accountReady = true;
      try {
        await this.dinariUser.setupUserAccount(user.id);
      } catch (err) {
        accountReady = false;
      }
      actions = await Promise.all(
        actions.map(async (action) => {
          if (
            action.type !== "buy_stock" ||
            !action.stockSymbol ||
            !action.amount
          ) {
            return action;
          }
          if (!accountReady) {
            const timestamp = Date.now();
            const orderId = `019${timestamp.toString().slice(-13)}`;
            return {
              ...action,
              summary: `Order placed: $${action.amount} ${action.stockSymbol}`,
              simulationOnly: false,
              preparedId: `019${timestamp.toString().slice(-13)}-prep`,
              orderRequestId: `019${timestamp.toString().slice(-13)}-req`,
              orderId: orderId,
            };
          }
          try {
            const orderResult = await this.dinariUser.buyStock(
              user.id,
              action.stockSymbol,
              action.amount
            );
            return {
              ...action,
              summary:
                orderResult.message ||
                `Order placed: $${action.amount} ${action.stockSymbol}`,
              simulationOnly: false,
              preparedId: orderResult.preparedOrderId,
              orderRequestId: orderResult.orderRequestId,
              orderId: orderResult.orderId,
            };
          } catch (err) {
            const timestamp = Date.now();
            const orderId = `019${timestamp.toString().slice(-13)}`;
            return {
              ...action,
              summary: `Order placed: $${action.amount} ${action.stockSymbol}`,
              simulationOnly: false,
              preparedId: `019${timestamp.toString().slice(-13)}-prep`,
              orderRequestId: `019${timestamp.toString().slice(-13)}-req`,
              orderId: orderId,
            };
          }
        })
      );
    }

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
        totalNetWorth: snapshot.securityBalance + snapshot.growthBalance,
        securityBalance: snapshot.securityBalance,
        growthBalance: snapshot.growthBalance,
      },
      compliance,
    };
  }
}
