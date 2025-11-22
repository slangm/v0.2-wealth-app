import { Injectable, Logger } from "@nestjs/common"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { AgentKit, CdpWalletProvider, walletActionProvider, cdpWalletActionProvider } from "@coinbase/agentkit"
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk"

type AgentContext = {
  message: string
  snapshot: unknown
  compliance: unknown
  wallet: unknown
}

@Injectable()
export class OpenAIAgentService {
  private readonly modelId = process.env.OPENAI_MODEL ?? "gpt-4o"
  private readonly logger = new Logger(OpenAIAgentService.name)
  private readonly agentKitPromise = this.initAgentKit()
  private readonly networkId = process.env.AGENT_NETWORK ?? "base-sepolia"

  private async initAgentKit() {
    const keyName = process.env.CDP_API_KEY_NAME
    const privateKey = process.env.CDP_API_KEY_PRIVATE_KEY
    if (!keyName || !privateKey) {
      this.logger.warn("CDP_API_KEY_NAME / CDP_API_KEY_PRIVATE_KEY not set; running LLM without AgentKit tools.")
      return null
    }
    const walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName: keyName,
      apiKeyPrivateKey: privateKey,
      networkId: this.networkId,
    })
    const cdpConfig = { apiKeyName: keyName, apiKeyPrivateKey: privateKey }
    const actionProviders = [walletActionProvider(), cdpWalletActionProvider(cdpConfig)]
    return AgentKit.from({
      walletProvider,
      actionProviders,
    })
  }

  async generate(context: AgentContext) {
    const model = openai(this.modelId)
    const agentKit = await this.agentKitPromise
    const tools = agentKit ? await getVercelAITools(agentKit) : undefined

    const result = await generateText({
      model,
      system: [
        `You are an onchain AI assistant on network ${this.networkId}.`,
        `Allowed tools/actions:`,
        `- walletActionProvider: get wallet details, native transfers (specify amount/token/receiver).`,
        `- cdpWalletActionProvider: trade via CDP (swap base assets like ETH/USDC/ONDO; stay within small test amounts unless user requests more).`,
        `Constraints: respect compliance flags (may be simulation only), never assume mainnet value, do not invent balances, do not deploy contracts.`,
        `Output concise, explain what you did and what will happen next.`,
      ].join("\n"),
      prompt: JSON.stringify(context),
      tools,
    } as any)

    const toolResults = (result as any).toolResults ?? []
    const toolSummaries: string[] = []
    const toolActions: Array<{ type: "advice"; summary: string }> = []

    for (const tr of toolResults) {
      const name = tr.toolName ?? tr.toolId ?? "tool"
      const parsed = this.parseResult(tr.result ?? tr)
      const summary = parsed ? `${name}: ${parsed}` : `${name}: executed`
      toolSummaries.push(summary)
      toolActions.push({ type: "advice", summary })
    }

    const replyText = (result as any).text?.trim?.() ?? ""
    const reply =
      replyText ||
      (toolSummaries.length ? `Tools executed:\n${toolSummaries.join("\n")}` : "No response generated.")

    return {
      reply,
      toolSummaries,
      toolActions,
      usedTools: Boolean(tools),
    }
  }

  private parseResult(result: unknown): string | null {
    if (!result) return null
    // Try to parse stringified JSON
    if (typeof result === "string") {
      try {
        const json = JSON.parse(result)
        return this.stringifyObject(json)
      } catch {
        return result
      }
    }
    if (typeof result === "object") {
      return this.stringifyObject(result as Record<string, unknown>)
    }
    return String(result)
  }

  private stringifyObject(obj: Record<string, any>): string {
    // Special-case wallet detail shape
    if (obj.address && obj.provider && obj.network) {
      const network = obj.network.protocol_family
        ? `${obj.network.protocol_family}/${obj.network.network_id ?? obj.network.chain_id ?? ""}`
        : JSON.stringify(obj.network)
      const balance = obj.balance ?? obj.native_balance ?? obj.nativeBalance
      return `Wallet ${obj.address} on ${network} • Balance: ${balance ?? "unknown"}`
    }
    return JSON.stringify(obj)
  }
}
