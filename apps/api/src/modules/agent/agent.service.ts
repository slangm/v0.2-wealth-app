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

    const toolDrivenActions =
      llmResult.toolActions?.map<AgentAction>((action: any) => ({
        type: "advice",
        summary: action.summary ?? action,
      })) ?? [];

    const fallbackActions: AgentAction[] = [
      {
        type: "advice",
        summary:
          "Rebalance deposits toward 60% Protected Savings / 40% Growth for ONDO exposure.",
      },
      compliance.canTrade
        ? {
            type: "swap",
            summary: `Swap 200 USDC → ONDO on ${wallet.network} via user wallet ${wallet.address}`,
          }
        : {
            type: "advice",
            summary:
              "Region blocked for live trades. Running in simulation-only mode.",
            simulationOnly: true,
          },
    ];

    const allActions = (
      toolDrivenActions.length ? toolDrivenActions : fallbackActions
    ).map((a) => ({
      ...a,
      simulationOnly: a.simulationOnly ?? !compliance.canTrade,
    }));

    // Separate advice actions from executable actions
    const adviceActions = allActions.filter((a) => a.type === "advice");
    const executableActions = allActions.filter(
      (a) => a.type !== "advice" && a.type !== "buy_stock"
    );
    const buyStockActions = allActions.filter((a) => a.type === "buy_stock");

    // Build reply text: naturally incorporate advice into the reply
    let replyText = llmResult.reply;

    // If LLM didn't generate a reply, create one that naturally includes advice
    if (
      !replyText ||
      replyText === "No response generated." ||
      replyText.trim() === ""
    ) {
      if (adviceActions.length > 0) {
        // Create a natural language reply incorporating the advice
        const firstAdvice = adviceActions[0].summary;
        // Convert advice summary to natural language
        replyText = `I recommend ${firstAdvice.toLowerCase()}.`;
      } else {
        replyText =
          "I can help you manage your portfolio. What would you like to know?";
      }
    }
    // If LLM generated a reply, use it as-is (advice is already incorporated in the natural language response)

    // Add compliance notice if needed
    if (!compliance.canTrade) {
      replyText = `${replyText}\n\nNote: Live trades are blocked for region: ${compliance.region}. Running in simulation-only mode.`;
    }

    this.audit.record({
      userId: user.id,
      action: "AGENT_CHAT",
      payload: { message, compliance, wallet },
      status: "ok",
    });

    return {
      reply: replyText,
      actions: [...executableActions, ...buyStockActions], // Include buy_stock actions for user confirmation
      portfolioSummary: {
        totalNetWorth: snapshot.securityBalance + snapshot.growthBalance,
        securityBalance: snapshot.securityBalance,
        growthBalance: snapshot.growthBalance,
      },
      compliance,
    };
  }
}
