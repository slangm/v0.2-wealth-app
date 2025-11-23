import { Injectable, Logger } from "@nestjs/common";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  AgentKit,
  CdpWalletProvider,
  walletActionProvider,
  cdpWalletActionProvider,
} from "@coinbase/agentkit";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { DinariService } from "../dinari/dinari.service";

type AgentContext = {
  message: string;
  snapshot: unknown;
  compliance: unknown;
  wallet: unknown;
  growthBalance?: number; // Growth account balance in USD
};

@Injectable()
export class OpenAIAgentService {
  private readonly modelId = process.env.OPENAI_MODEL ?? "gpt-4o";
  private readonly logger = new Logger(OpenAIAgentService.name);
  private readonly agentKitPromise = this.initAgentKit();
  private readonly networkId =
    process.env.GROWTH_NETWORK ?? process.env.AGENT_NETWORK ?? "base-sepolia";

  constructor(private readonly dinariService: DinariService) {}

  private async initAgentKit() {
    const keyName = process.env.CDP_API_KEY_NAME;
    const privateKey = process.env.CDP_API_KEY_PRIVATE_KEY;
    if (!keyName || !privateKey) {
      this.logger.warn(
        "CDP_API_KEY_NAME / CDP_API_KEY_PRIVATE_KEY not set; running LLM without AgentKit tools."
      );
      return null;
    }
    const walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName: keyName,
      apiKeyPrivateKey: privateKey,
      networkId: this.networkId,
    });
    const cdpConfig = { apiKeyName: keyName, apiKeyPrivateKey: privateKey };
    const actionProviders = [
      walletActionProvider(),
      cdpWalletActionProvider(cdpConfig),
    ];
    return AgentKit.from({
      walletProvider,
      actionProviders,
    });
  }

  async generate(context: AgentContext) {
    const model = openai(this.modelId);
    const agentKit = await this.agentKitPromise;
    let tools = undefined;
    if (agentKit) {
      try {
        tools = await getVercelAITools(agentKit);
      } catch (err) {
        this.logger.warn(
          `Failed to initialize AgentKit tools, falling back to text-only: ${String(err)}`
        );
      }
    }

    // Get 3 random Dinari stocks for AI to choose from
    let randomStocksInfo = "";
    let randomStocks: any[] = [];
    try {
      randomStocks = await this.dinariService.getRandomStocks(3);
      if (randomStocks.length > 0) {
        randomStocksInfo = `Here are 3 random stocks available for purchase:\n${randomStocks
          .map(
            (s, i) =>
              `${i + 1}. ${s.symbol} (${s.name})${s.currentPrice ? ` - $${s.currentPrice}` : ""}${s.dayChangePct ? ` (${s.dayChangePct > 0 ? "+" : ""}${s.dayChangePct}%)` : ""}`
          )
          .join(
            "\n"
          )}\n\nWhen user asks to buy stocks or invest in Dinari, randomly select ONE of these 3 stocks and recommend buying it.`;
      } else {
        // Fallback to full list if random selection fails
        randomStocksInfo = await this.dinariService.getStocksForAgent();
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch Dinari stocks: ${err}`);
      randomStocksInfo = "Dinari stocks temporarily unavailable.";
    }

    // Get growth account balance from context
    const growthBalance = (context as any).growthBalance || 1000; // Default to 1000 USD

    const result = await generateText({
      model,
      system: [
        `You are an onchain AI assistant on network ${this.networkId} (growth).`,
        `Allowed tools/actions:`,
        `- walletActionProvider: get wallet details, native transfers.`,
        `- cdpWalletActionProvider: trade/swap on Polygon; prefer lowest fee tier (500 = 0.05%); cap single trade <= 500 USDC.`,
        `- Dinari stocks: You can recommend buying tokenized stocks via Dinari API.`,
        ``,
        `User's Growth Account Balance: $${growthBalance.toFixed(2)} USD`,
        ``,
        `Growth investment options:`,
        `1. Polygon/Beefy vaults (whitelist):`,
        `   * LOW: mooAaveUSDCv3 (USDC single, Aave)`,
        `   * MID: mooBalancerMaticX-wMATIC (MaticX/wMATIC)`,
        `   * HIGH: mooQuickQMATIC-wETH (MATIC/ETH LP)`,
        `2. Dinari tokenized stocks:`,
        `   ${randomStocksInfo}`,
        ``,
        `Rules:`,
        `- Only allocate across whitelisted vaults; sum of allocations = 100%. Reject unknown vaults.`,
        `- Single deposit per vault <= 500 USDC.`,
        `- For Dinari stocks: When user asks to buy stocks or invest, randomly select ONE stock from the 3 provided stocks above and create a buy_stock action with stockSymbol and amount.`,
        `- IMPORTANT: When recommending Dinari stocks, ALWAYS format your response as:`,
        `  "You have $${growthBalance.toFixed(2)} in your growth account. I recommend buying $[AMOUNT] worth of [STOCK_SYMBOL]. This represents [PERCENTAGE]% of your growth account balance."`,
        `  Where [PERCENTAGE] = ([AMOUNT] / ${growthBalance.toFixed(2)}) * 100, rounded to 1 decimal place.`,
        `- Example: If recommending $100 of AAPL: "You have $${growthBalance.toFixed(2)} in your growth account. I recommend buying $100 worth of AAPL. This represents ${((100 / growthBalance) * 100).toFixed(1)}% of your growth account balance."`,
        `- When recommending Dinari stocks, include a buy_stock action (not just advice) so user can confirm and execute.`,
        `- Always calculate and show the percentage accurately based on the user's current balance.`,
        `- Do NOT deploy contracts. Respect compliance (may be simulation only).`,
        `- Keep replies concise and describe executed steps.`,
      ].join("\n"),
      prompt: JSON.stringify(context),
      tools,
    } as any);

    const toolResults = (result as any).toolResults ?? [];
    const toolSummaries: string[] = [];
    const toolActions: Array<{
      type: "advice" | "buy_stock";
      summary: string;
      stockSymbol?: string;
      amount?: number;
    }> = [];

    for (const tr of toolResults) {
      const name = tr.toolName ?? tr.toolId ?? "tool";
      const parsed = this.parseResult(tr.result ?? tr);
      const summary = parsed ? `${name}: ${parsed}` : `${name}: executed`;
      toolSummaries.push(summary);
      toolActions.push({ type: "advice", summary });
    }

    const replyText = (result as any).text?.trim?.() ?? "";

    // Parse buy_stock actions from reply text
    // Look for patterns like "buy $100 of AAPL" or "purchase AAPL for $100"
    const buyStockRegex =
      /(?:buy|purchase|invest)\s+(?:in\s+)?\$?(\d+(?:\.\d+)?)\s+(?:worth\s+of\s+|in\s+)?([A-Z]{1,5})|([A-Z]{1,5})\s+(?:for\s+|at\s+)?\$?(\d+(?:\.\d+)?)/gi;
    const buyMatches = [...replyText.matchAll(buyStockRegex)];

    for (const match of buyMatches) {
      const amount = parseFloat(match[1] || match[4] || "100");
      const symbol = (match[2] || match[3] || "").toUpperCase();
      if (symbol && amount > 0) {
        toolActions.push({
          type: "buy_stock",
          summary: `Buy $${amount} worth of ${symbol}`,
          stockSymbol: symbol,
          amount: amount,
        });
      }
    }

    const reply =
      replyText ||
      (toolSummaries.length
        ? `Tools executed:\n${toolSummaries.join("\n")}`
        : "No response generated.");

    return {
      reply,
      toolSummaries,
      toolActions,
      usedTools: Boolean(tools),
    };
  }

  private parseResult(result: unknown): string | null {
    if (!result) return null;
    // Try to parse stringified JSON
    if (typeof result === "string") {
      try {
        const json = JSON.parse(result);
        return this.stringifyObject(json);
      } catch {
        return result;
      }
    }
    if (typeof result === "object") {
      return this.stringifyObject(result as Record<string, unknown>);
    }
    return String(result);
  }

  private stringifyObject(obj: Record<string, any>): string {
    // Special-case wallet detail shape
    if (obj.address && obj.provider && obj.network) {
      const network = obj.network.protocol_family
        ? `${obj.network.protocol_family}/${obj.network.network_id ?? obj.network.chain_id ?? ""}`
        : JSON.stringify(obj.network);
      const balance = obj.balance ?? obj.native_balance ?? obj.nativeBalance;
      return `Wallet ${obj.address} on ${network} • Balance: ${balance ?? "unknown"}`;
    }
    return JSON.stringify(obj);
  }
}
