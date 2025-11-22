import { Injectable } from "@nestjs/common"
import { PortfolioService } from "../portfolio/portfolio.service"
import { ComplianceService } from "../compliance/compliance.service"
import { WalletService } from "../wallet/wallet.service"
import { AuditService } from "../audit/audit.service"
import type { User } from "../users/user.entity"
import { OpenAIAgentService } from "./openai-agent.service"

export type AgentAction = {
  type: "swap" | "deposit" | "rebalance" | "advice"
  summary: string
  simulationOnly?: boolean
}

export type AgentReply = {
  reply: string
  actions: AgentAction[]
  portfolioSummary: {
    totalNetWorth: number
    securityBalance: number
    growthBalance: number
  }
  compliance: {
    canTrade: boolean
    region: string
  }
}

@Injectable()
export class AgentService {
  constructor(
    private readonly portfolio: PortfolioService,
    private readonly compliance: ComplianceService,
    private readonly walletService: WalletService,
    private readonly audit: AuditService,
    private readonly llm: OpenAIAgentService,
  ) {}

  async chat(user: User, message: string): Promise<AgentReply> {
    const snapshot = this.portfolio.getSnapshot()
    const compliance = this.compliance.describe(user)
    const wallet = await this.walletService.ensureUserWallet(user.id)

    const llmResult = await this.llm.generate({
      message,
      snapshot,
      compliance,
      wallet,
    })

    const toolDrivenActions =
      llmResult.toolActions?.map<AgentAction>((action: any) => ({
        type: "advice",
        summary: action.summary ?? action,
      })) ?? []

    const fallbackActions: AgentAction[] = [
      {
        type: "advice",
        summary: "Rebalance deposits toward 60% Protected Savings / 40% Growth for ONDO exposure.",
      },
      compliance.canTrade
        ? {
            type: "swap",
            summary: `Swap 200 USDC → ONDO on ${wallet.network} via user wallet ${wallet.address}`,
          }
        : {
            type: "advice",
            summary: "Region blocked for live trades. Running in simulation-only mode.",
            simulationOnly: true,
          },
    ]

    const actions = (toolDrivenActions.length ? toolDrivenActions : fallbackActions).map((a) => ({
      ...a,
      simulationOnly: a.simulationOnly ?? !compliance.canTrade,
    }))

    this.audit.record({
      userId: user.id,
      action: "AGENT_CHAT",
      payload: { message, compliance, wallet },
      status: "ok",
    })

    const replyText = compliance.canTrade
      ? llmResult.reply
      : `${llmResult.reply}\n\nLive trades are blocked for region: ${compliance.region}. Running in simulation-only mode.`

    return {
      reply: replyText,
      actions,
      portfolioSummary: {
        totalNetWorth: snapshot.securityBalance + snapshot.growthBalance,
        securityBalance: snapshot.securityBalance,
        growthBalance: snapshot.growthBalance,
      },
      compliance,
    }
  }
}
