import { Injectable, Logger } from "@nestjs/common";
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
  private readonly networkId =
    process.env.GROWTH_NETWORK ?? process.env.AGENT_NETWORK ?? "base-sepolia";

  constructor(private readonly dinariService: DinariService) {}

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

    // [DEBUG] Simple connectivity test to rule out API/Auth issues
    try {
      this.logger.debug("🔍 Testing basic OpenAI connectivity...");
      // Use a very simple prompt and model config
      const testResult = await generateText({
        model: openai("gpt-4o") as any,
        prompt: "Ping",
      });
      this.logger.debug(
        `✅ Connectivity test passed. Response: "${testResult.text}"`
      );
    } catch (e) {
      this.logger.error(`❌ Connectivity test failed: ${e}`);
      // If basic connectivity fails, the main request will likely fail too.
      // But we continue to let the main flow handle error reporting.
    }

    // Temporarily disable tool registration to avoid schema issues
    const tools: undefined = undefined;
    const toolsAvailable = false;

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
      `1. You MUST ALWAYS respond to user queries with helpful text. Never return empty responses. This is MANDATORY.`,
      `2. When user asks to recommend stocks, wants to make money, or asks for investment advice, you MUST recommend a Dinari stock from the list below.`,
      `3. When recommending stocks, provide a clear text response with the recommendation.`,
      ``,
      `User's Growth Account Balance: $${growthBalance.toFixed(2)} USD`,
      ``,
      `Available Dinari Stocks (choose ONE when recommending):`,
      `${randomStocksInfo}`,
      ``,
      `MANDATORY: When user asks for stock recommendations, wants to invest, or wants to make money:`,
      `1. Select ONE stock from the available stocks listed above`,
      `2. Recommend an amount (typically $100-$500, or 10-50% of balance)`,
      `3. Format your response EXACTLY as:`,
      `   "You have $${growthBalance.toFixed(2)} in your growth account. I recommend buying $[AMOUNT] worth of [STOCK_SYMBOL]. This represents [PERCENTAGE]% of your growth account balance."`,
      `   Where [PERCENTAGE] = ([AMOUNT] / ${growthBalance.toFixed(2)}) * 100, rounded to 1 decimal place.`,
      ``,
      `Example response for "recommend me a stock":`,
      `"You have $${growthBalance.toFixed(2)} in your growth account. I recommend buying $200 worth of AAPL. This represents ${((200 / growthBalance) * 100).toFixed(1)}% of your growth account balance."`,
      ``,
      `Other Rules:`,
      `- When user asks to recommend stocks or wants to invest, directly recommend a stock from the list above.`,
      `- When user asks about wallet, provide wallet information if available in context.`,
      `- Keep replies concise and helpful.`,
      `- Respond in the same language the user used.`,
      `- ALWAYS provide a text response, even if you plan to use tools.`,
      `- If you cannot use tools, still provide helpful text responses based on the context provided.`,
    ].join("\n");

    // Log the complete prompt with all dynamic variables
    this.logger.log("=".repeat(80));
    this.logger.log("📤 Sending prompt to AI:");
    this.logger.log("=".repeat(80));
    this.logger.log(`🔧 Dynamic Variables:`);
    this.logger.log(`   - Network ID: ${this.networkId}`);
    this.logger.log(`   - Growth Balance: $${growthBalance.toFixed(2)} USD`);
    this.logger.log(`   - Random Stocks Count: ${randomStocks.length}`);
    this.logger.log(`   - Tools Available: ${toolsAvailable ? "Yes" : "No"}`);
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
      this.logger.log(`Tools: No`);
      this.logger.log("=".repeat(80));

      const generateTextParams: any = {
        model: openai("gpt-4o") as any,
        system: systemPrompt,
        prompt: userMessage,
        maxTokens: 1000,
      };

      // Print RAW request parameters BEFORE calling generateText
      this.logger.log("=".repeat(80));
      this.logger.log(
        "🔴 RAW REQUEST TO generateText (before SDK processing):"
      );
      this.logger.log("=".repeat(80));
      this.logger.log(
        JSON.stringify(
          {
            model: "openai('gpt-4o')",
            system: systemPrompt.substring(0, 200) + "...",
            prompt: userMessage,
            maxTokens: 1000,
            tools: undefined,
            maxSteps: undefined,
            hasTools: false,
          },
          null,
          2
        )
      );
      this.logger.log("=".repeat(80));

      // Log the actual generateTextParams that will be sent
      this.logger.debug(
        `generateTextParams keys: ${Object.keys(generateTextParams).join(", ")}`
      );

      result = await generateText(generateTextParams);

      // Print RAW response from OpenAI API (from result.response)
      this.logger.log("=".repeat(80));
      this.logger.log(
        "🟢 RAW RESPONSE FROM OpenAI API (original, unprocessed):"
      );
      this.logger.log("=".repeat(80));
      if (result.response) {
        this.logger.log(JSON.stringify(result.response, null, 2));
      } else {
        this.logger.log("No raw response found in result.response");
      }
      this.logger.log("=".repeat(80));

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
          this.logger.log(
            `Step ${idx}: ${JSON.stringify(step).substring(0, 300)}`
          );
        });
      }

      // Check warnings
      if (
        result.warnings &&
        Array.isArray(result.warnings) &&
        result.warnings.length > 0
      ) {
        this.logger.warn(`Warnings: ${JSON.stringify(result.warnings)}`);
      }

      // Print RAW request body that was actually sent to OpenAI API
      this.logger.log("=".repeat(80));
      this.logger.log("🔴 RAW REQUEST BODY SENT TO OpenAI API:");
      this.logger.log("=".repeat(80));
      if (result.request?.body) {
        // Print the full request body, but truncate very long content
        const requestBodyCopy = JSON.parse(JSON.stringify(result.request.body));
        if (requestBodyCopy.input && Array.isArray(requestBodyCopy.input)) {
          requestBodyCopy.input = requestBodyCopy.input.map((msg: any) => {
            if (msg.content && msg.content.length > 500) {
              return { ...msg, content: msg.content.substring(0, 500) + "..." };
            }
            return msg;
          });
        }
        this.logger.log(JSON.stringify(requestBodyCopy, null, 2));
      } else {
        this.logger.log("No request body found in result.request.body");
      }
      this.logger.log("=".repeat(80));

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
    if (
      !resultText &&
      result.steps &&
      Array.isArray(result.steps) &&
      result.steps.length > 0
    ) {
      const lastStep = result.steps[result.steps.length - 1];
      if (lastStep.text) {
        resultText = lastStep.text.trim();
        this.logger.debug(
          `Extracted text from last step: ${resultText.substring(0, 100)}`
        );
      }
    }

    const toolResults = result.toolResults ?? [];
    const toolSummaries: string[] = [];
    const toolActions: Array<{
      type: "advice" | "buy_stock";
      summary: string;
      stockSymbol?: string;
      amount?: number;
    }> = [];

    const toolResultsCount = toolResults.length;
    const toolCallsCount = result.toolCalls?.length ?? 0;
    this.logger.debug(
      `LLM result: text=${resultText.substring(0, 100)}${resultText.length > 100 ? "..." : ""}, textLength=${resultText.length}, toolCalls=${toolCallsCount}, toolResults=${toolResultsCount}`
    );

    if (!resultText && toolResultsCount === 0) {
      this.logger.warn(
        `⚠️ LLM returned empty response! Full result: ${JSON.stringify(result).substring(0, 500)}`
      );

      // Generate a fallback stock recommendation if the user asked about stocks
      if (
        userMessage.toLowerCase().includes("stock") &&
        randomStocks.length > 0
      ) {
        const selectedStock =
          randomStocks[Math.floor(Math.random() * randomStocks.length)];
        const amount = Math.min(
          500,
          Math.max(100, Math.floor(growthBalance * 0.2))
        );
        const percentage = ((amount / growthBalance) * 100).toFixed(1);
        resultText = `You have $${growthBalance.toFixed(
          2
        )} in your growth account. I recommend buying $${amount} worth of ${
          selectedStock.symbol
        }. This represents ${percentage}% of your growth account balance.`;
        toolActions.push({
          type: "buy_stock",
          summary: `Buy $${amount} of ${selectedStock.symbol} (fallback)`,
          stockSymbol: selectedStock.symbol,
          amount,
        });
        this.logger.debug(
          `Generated fallback stock recommendation: ${resultText}`
        );
      }
    }

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
      // Fallback 1: tool summaries / actions
      if (toolSummaries.length > 0) {
        reply = `Tools executed:\n${toolSummaries.join("\n")}`;
      } else if (toolActions.length > 0) {
        reply = toolActions.map((a) => a.summary).join(". ");
      } else {
        // Fallback 2: direct OpenAI chat completion with minimal prompt
        try {
          const chatResp = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
              },
              body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are an onchain AI assistant. Always answer with non-empty text.",
                  },
                  { role: "user", content: userMessage },
                ],
                max_tokens: 200,
              }),
            }
          );
          if (chatResp.ok) {
            const chatJson: any = await chatResp.json();
            reply = chatJson?.choices?.[0]?.message?.content ?? "";
            this.logger.debug(
              `Fallback chat completion reply length=${reply.length}`
            );
          } else {
            this.logger.warn(
              `Fallback chat completion failed: status ${chatResp.status}`
            );
          }
        } catch (err) {
          this.logger.warn(`Fallback chat completion error: ${err}`);
        }

        // Fallback 3: default text
        if (!reply || reply.trim() === "") {
          reply =
            "I understand your request. How can I help you with your portfolio today?";
        }
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
