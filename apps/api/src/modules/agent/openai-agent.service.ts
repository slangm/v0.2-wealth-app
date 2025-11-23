import { Injectable, Logger } from "@nestjs/common";
import {
  AgentKit,
  CdpWalletProvider,
  walletActionProvider,
  cdpWalletActionProvider,
} from "@coinbase/agentkit";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
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
    // Check API key configuration
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error(
        "⚠️ OPENAI_API_KEY not set! OpenAI API calls will fail."
      );
    } else {
      this.logger.debug(
        `OpenAI API Key configured: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}`
      );
    }

    const agentKit = await this.agentKitPromise;
    let tools = undefined;
    if (agentKit) {
      try {
        tools = await getVercelAITools(agentKit);
        // Log tools structure for debugging
        this.logger.debug(
          `Tools type: ${typeof tools}, isArray: ${Array.isArray(tools)}, keys: ${tools && typeof tools === "object" ? Object.keys(tools).join(", ") : "N/A"}`
        );
        if (tools && typeof tools === "object" && !Array.isArray(tools)) {
          this.logger.debug(
            `Tools structure: ${JSON.stringify(Object.keys(tools)).substring(0, 200)}`
          );
        }
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

    // Format user message more naturally
    const userMessage =
      typeof context.message === "string"
        ? context.message
        : JSON.stringify(context.message);

    // Build system prompt with all dynamic variables
    const systemPrompt = [
      `You are an onchain AI assistant on network ${this.networkId} (growth).`,
      ``,
      `CRITICAL RULES:`,
      `1. You MUST ALWAYS respond to user queries with helpful text. Never return empty responses.`,
      `2. When user asks to recommend stocks, wants to make money, or asks for investment advice, you MUST recommend a Dinari stock from the list below.`,
      `3. When recommending stocks, ALWAYS create a buy_stock action with stockSymbol and amount.`,
      ``,
      `Available Tools:`,
      `- walletActionProvider: Get wallet details (address, balance, network). Use when user asks about wallet.`,
      `- cdpWalletActionProvider: Trade/swap tokens on Polygon.`,
      ``,
      `User's Growth Account Balance: $${growthBalance.toFixed(2)} USD`,
      ``,
      `Available Dinari Stocks (choose ONE when recommending):`,
      `${randomStocksInfo}`,
      ``,
      `MANDATORY: When user asks for stock recommendations, wants to invest, or wants to make money:`,
      `1. Select ONE stock from the 3 stocks listed above`,
      `2. Recommend an amount (typically $100-$500, or 10-50% of balance)`,
      `3. Format your response EXACTLY as:`,
      `   "You have $${growthBalance.toFixed(2)} in your growth account. I recommend buying $[AMOUNT] worth of [STOCK_SYMBOL]. This represents [PERCENTAGE]% of your growth account balance."`,
      `   Where [PERCENTAGE] = ([AMOUNT] / ${growthBalance.toFixed(2)}) * 100, rounded to 1 decimal place.`,
      `4. Create a buy_stock action with:`,
      `   - type: "buy_stock"`,
      `   - stockSymbol: [STOCK_SYMBOL] (e.g., "AAPL", "SPY", "META")`,
      `   - amount: [AMOUNT] (number in USD)`,
      `   - summary: "Buy $[AMOUNT] worth of [STOCK_SYMBOL]"`,
      ``,
      `Example response for "recommend me a stock":`,
      `"You have $${growthBalance.toFixed(2)} in your growth account. I recommend buying $200 worth of AAPL. This represents ${((200 / growthBalance) * 100).toFixed(1)}% of your growth account balance."`,
      `And create action: {type: "buy_stock", stockSymbol: "AAPL", amount: 200, summary: "Buy $200 worth of AAPL"}`,
      ``,
      `Other Rules:`,
      `- When user asks to recommend stocks or wants to invest, DO NOT call walletActionProvider first. Directly recommend a stock from the list above.`,
      `- When user asks ONLY about wallet address (without asking for stock recommendations), use walletActionProvider tool first, then provide the address.`,
      `- Keep replies concise and helpful.`,
      `- Respond in the same language the user used.`,
      `- If tools are unavailable, still provide helpful text responses based on context.`,
    ].join("\n");

    // Log the complete prompt with all dynamic variables
    this.logger.log("=".repeat(80));
    this.logger.log("📤 Sending prompt to AI:");
    this.logger.log("=".repeat(80));
    this.logger.log(`🔧 Dynamic Variables:`);
    this.logger.log(`   - Network ID: ${this.networkId}`);
    this.logger.log(`   - Growth Balance: $${growthBalance.toFixed(2)} USD`);
    this.logger.log(`   - Random Stocks Count: ${randomStocks.length}`);
    this.logger.log(`   - Tools Available: ${tools ? "Yes" : "No"}`);
    this.logger.log(
      `   - Random Stocks Info Length: ${randomStocksInfo.length} chars`
    );
    if (randomStocks.length > 0) {
      this.logger.log(
        `   - Random Stocks: ${randomStocks.map((s) => `${s.symbol} (${s.name})`).join(", ")}`
      );
    }
    this.logger.log("");
    this.logger.log(`📋 Context Info:`);
    this.logger.log(
      `   - Message: ${userMessage.substring(0, 100)}${userMessage.length > 100 ? "..." : ""}`
    );
    this.logger.log(
      `   - Snapshot: ${JSON.stringify(context.snapshot).substring(0, 200)}${JSON.stringify(context.snapshot).length > 200 ? "..." : ""}`
    );
    this.logger.log(`   - Compliance: ${JSON.stringify(context.compliance)}`);
    this.logger.log(
      `   - Wallet: ${JSON.stringify(context.wallet).substring(0, 200)}${JSON.stringify(context.wallet).length > 200 ? "..." : ""}`
    );
    this.logger.log("");
    this.logger.log(`📝 System Prompt (${systemPrompt.length} chars):`);
    this.logger.log(systemPrompt);
    this.logger.log("");
    this.logger.log(`💬 User Message (${userMessage.length} chars):`);
    this.logger.log(userMessage);
    this.logger.log("=".repeat(80));

    let result: any;
    try {
      this.logger.log("=".repeat(80));
      this.logger.log("📤 OpenAI API Request (using Vercel AI SDK):");
      this.logger.log("=".repeat(80));
      this.logger.log(`Model: gpt-4o-mini`);
      this.logger.log(`System message length: ${systemPrompt.length} chars`);
      this.logger.log(`User message: ${userMessage}`);
      this.logger.log(`Tools: ${tools ? "Yes" : "No"}`);
      if (tools) {
        this.logger.log(
          `Tools count: ${Array.isArray(tools) ? tools.length : Object.keys(tools).length}`
        );
      }
      this.logger.log("=".repeat(80));

      // Use standard Vercel AI SDK generateText
      // According to Vercel AI SDK and Coinbase AgentKit docs:
      // - model: LanguageModel (from @ai-sdk/openai)
      // - system: string (system prompt)
      // - prompt: string (user message)
      // - tools: object with tool definitions (from getVercelAITools)
      // - maxTokens: number (max tokens in response)
      // - maxSteps: number (max tool call steps, required when using tools)
      const generateTextParams: any = {
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt: userMessage,
        maxTokens: 1000,
      };

      // Add tools if available (getVercelAITools returns Vercel AI SDK compatible tools)
      // When using tools, maxSteps is required to allow multi-step tool calls
      if (tools) {
        generateTextParams.tools = tools;
        generateTextParams.maxSteps = 10; // Allow up to 10 tool call steps
        this.logger.log(`Added tools to generateText call (maxSteps: 10)`);
      }

      result = await generateText(generateTextParams);

      this.logger.log("=".repeat(80));
      this.logger.log("📥 OpenAI API Response:");
      this.logger.log("=".repeat(80));
      this.logger.log(`Result keys: ${Object.keys(result).join(", ")}`);
      this.logger.log(`Text: ${JSON.stringify(result.text)}`);
      this.logger.log(`Text length: ${result.text?.length ?? 0}`);
      this.logger.log(`Finish reason: ${result.finishReason}`);
      this.logger.log(`Tool calls: ${result.toolCalls?.length ?? 0}`);
      this.logger.log(`Tool results: ${result.toolResults?.length ?? 0}`);
      
      // Check steps (multi-step tool calls)
      if (result.steps && Array.isArray(result.steps)) {
        this.logger.log(`Steps count: ${result.steps.length}`);
        result.steps.forEach((step: any, idx: number) => {
          this.logger.log(`Step ${idx}: ${JSON.stringify(step).substring(0, 300)}`);
        });
      }
      
      // Check warnings
      if (result.warnings && Array.isArray(result.warnings) && result.warnings.length > 0) {
        this.logger.warn(`Warnings: ${JSON.stringify(result.warnings)}`);
      }
      
      // Check request body to see what was actually sent
      if (result.request?.body) {
        this.logger.log(`Request body keys: ${Object.keys(result.request.body).join(", ")}`);
        if (result.request.body.input) {
          this.logger.log(`Request input (first 500 chars): ${JSON.stringify(result.request.body.input).substring(0, 500)}`);
        }
        if (result.request.body.messages) {
          this.logger.log(`Request messages count: ${Array.isArray(result.request.body.messages) ? result.request.body.messages.length : 'N/A'}`);
        }
      }
      
      if (result.usage) {
        this.logger.log(`Usage: ${JSON.stringify(result.usage)}`);
      }
      if (result.response) {
        this.logger.log(
          `Response: ${JSON.stringify(result.response, null, 2)}`
        );
      }
      this.logger.log(
        `Full result (first 2000 chars): ${JSON.stringify(result).substring(0, 2000)}`
      );
      this.logger.log("=".repeat(80));
    } catch (error: any) {
      this.logger.error(`❌ LLM generation error: ${error?.message || error}`);
      this.logger.error(`Error type: ${error?.constructor?.name}`);
      this.logger.error(`Error stack: ${error?.stack?.substring(0, 500)}`);
      if (error?.response) {
        this.logger.error(
          `Error response: ${JSON.stringify(error.response).substring(0, 500)}`
        );
      }
      // Don't throw, return a fallback response instead
      return {
        reply: `I apologize, but I'm experiencing technical difficulties. Please try again later. Error: ${error?.message || "Unknown error"}`,
        toolSummaries: [],
        toolActions: [],
        usedTools: false,
      };
    }

    // Extract text from result
    // When using tools with maxSteps, text might be in the last step
    let resultText = result.text?.trim() ?? "";
    
    // If text is empty but we have steps, try to extract from the last step
    if (!resultText && result.steps && Array.isArray(result.steps) && result.steps.length > 0) {
      const lastStep = result.steps[result.steps.length - 1];
      if (lastStep.text) {
        resultText = lastStep.text.trim();
        this.logger.debug(`Extracted text from last step: ${resultText.substring(0, 100)}`);
      }
    }
    
    const toolResultsCount = result.toolResults?.length ?? 0;
    const toolCallsCount = result.toolCalls?.length ?? 0;
    this.logger.debug(
      `LLM result: text=${resultText.substring(0, 100)}${resultText.length > 100 ? "..." : ""}, textLength=${resultText.length}, toolCalls=${toolCallsCount}, toolResults=${toolResultsCount}`
    );

    if (!resultText && toolResultsCount === 0) {
      this.logger.warn(
        `⚠️ LLM returned empty response! Full result: ${JSON.stringify(result).substring(0, 500)}`
      );
    }

    const toolResults = result.toolResults ?? [];
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

    const replyText = result.text?.trim() ?? "";

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

    // Ensure we always have a reply
    let reply = replyText;
    if (!reply || reply.trim() === "") {
      if (toolSummaries.length > 0) {
        reply = `Tools executed:\n${toolSummaries.join("\n")}`;
      } else if (toolActions.length > 0) {
        // If we have actions but no text, create a reply from actions
        reply = toolActions.map((a) => a.summary).join(". ");
      } else {
        // Fallback: provide a helpful default response
        reply =
          "I understand your request. How can I help you with your portfolio today?";
      }
    }

    this.logger.debug(
      `Final reply: ${reply.substring(0, 200)}, actions: ${toolActions.length}`
    );

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
