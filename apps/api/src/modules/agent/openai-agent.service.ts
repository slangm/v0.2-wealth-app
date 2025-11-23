import { Injectable, Logger } from "@nestjs/common";
import { DinariService } from "../dinari/dinari.service";
import { DinariUserService } from "../dinari/dinari-user.service";
import { PaymentsService } from "../payments/payments.service";
import { PortfolioService } from "../portfolio/portfolio.service";
import { InputParser } from "./input-parser";
import { PromptBuilder } from "./prompt-builder";
import { ToolRegistry } from "./tool-registry";
import { AgentRunner } from "./agent-runner";
import { AgentLogger } from "./agent-logger";

type AgentContext = {
  message: string;
  snapshot: unknown;
  compliance: unknown;
  wallet: unknown;
  growthBalance?: number;
  userId?: string;
};

@Injectable()
export class OpenAIAgentService {
  private readonly logger = new Logger(OpenAIAgentService.name);
  private readonly agentLogger = new AgentLogger(this.logger);

  constructor(
    private readonly dinariService: DinariService,
    private readonly dinariUserService: DinariUserService,
    private readonly paymentsService: PaymentsService,
    private readonly portfolioService: PortfolioService
  ) {}

  async generate(context: AgentContext) {
    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error(
        "⚠️ OPENAI_API_KEY not set! OpenAI API calls will fail."
      );
      throw new Error("OpenAI API key not configured");
    }

    // Get growth account balance
    const growthBalance = context.growthBalance || 1000;

    // Get available stocks
    let availableStocks: Array<{ symbol: string; name: string }> = [];
    try {
      const stocks = await this.dinariService.getStocks();
      availableStocks = stocks.slice(0, 10).map((s) => ({
        symbol: s.symbol,
        name: s.name,
      }));
      this.logger.log(
        `📊 Loaded ${availableStocks.length} stocks: ${availableStocks.map((s) => s.symbol).join(", ")}`
      );
    } catch (err) {
      this.logger.warn(`Failed to fetch stocks: ${err}`);
    }

    // Parse user input
    const originalMessage =
      typeof context.message === "string"
        ? context.message
        : JSON.stringify(context.message);

    const parsedInput = InputParser.parse(originalMessage);

    const userWantsStockAction =
      parsedInput.intent === "buy" || parsedInput.intent === "recommend";

    if (userWantsStockAction) {
      if (!context.userId) {
        throw new Error("User ID is required for stock operations.");
      }
      const autoResult = await this.handleAutoBuy({
        userId: context.userId,
        requestedStock: parsedInput.stockSymbol,
        growthBalance,
        availableStocks,
      });
      return autoResult;
    }

    // Log request
    this.agentLogger.logRequest({
      message: originalMessage,
      growthBalance,
      availableStocks,
      parsedInput,
    });

    // Build prompt
    const systemPrompt = PromptBuilder.buildSystemPrompt({
      growthBalance,
      availableStocks,
      userSpecifiedStock: parsedInput.stockSymbol,
      userSpecifiedAmount: parsedInput.amount,
    });

    const userMessage = PromptBuilder.buildUserMessage(
      originalMessage,
      growthBalance,
      parsedInput
    );

    // Build tools
    const tools: Record<string, any> = {};
    const toolContext = {
      userId: context.userId!,
      growthBalance,
      availableStocks,
      dinariUserService: this.dinariUserService,
      paymentsService: this.paymentsService,
      portfolioService: this.portfolioService,
    };

    if (context.userId) {
      // Always register buy_stock if stocks available
      if (availableStocks.length > 0) {
        tools.buy_stock = ToolRegistry.createBuyStockTool(toolContext);
      }

      // Register other tools
      const depositTool = ToolRegistry.createDepositTool(toolContext);
      if (depositTool) {
        tools.deposit = depositTool;
      }

      const swapTool = ToolRegistry.createSwapTool(toolContext);
      if (swapTool) {
        tools.swap = swapTool;
      }

      const rebalanceTool = ToolRegistry.createRebalanceTool(toolContext);
      if (rebalanceTool) {
        tools.rebalance = rebalanceTool;
      }

      this.logger.log(`🔧 Tools registered: ${Object.keys(tools).join(", ")}`);
    } else {
      this.logger.warn(`⚠️ Tools not registered: userId not available`);
    }

    // Run agent
    const result = await AgentRunner.run({
      systemPrompt,
      userMessage,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      logger: this.logger,
      growthBalance,
    });

    // Log response
    this.agentLogger.logResponse(result);

    return {
      reply: result.reply,
      toolSummaries: result.toolSummaries,
      toolActions: result.toolActions,
      usedTools: Object.keys(tools).length > 0,
    };
  }

  private async handleAutoBuy(params: {
    userId: string;
    requestedStock?: string | null;
    growthBalance: number;
    availableStocks: Array<{ symbol: string; name: string }>;
  }) {
    const { userId, requestedStock, growthBalance, availableStocks } = params;
    if (!availableStocks.length) {
      return {
        reply: "No stocks are currently available. Please try again later.",
        toolSummaries: [],
        toolActions: [],
        usedTools: false,
      };
    }

    const stockSymbol = (
      requestedStock?.toUpperCase() ||
      availableStocks[Math.floor(Math.random() * availableStocks.length)].symbol
    ).toUpperCase();

    let amount = Math.floor(growthBalance * 0.1);
    if (amount < 100) amount = 100;

    try {
      const result = await this.dinariUserService.buyStock(
        userId,
        stockSymbol,
        amount
      );

      const percentage = ((amount / growthBalance) * 100).toFixed(1);
      const summary = `Prepared an automatic order for ${stockSymbol}: $${amount} (about ${percentage}% of your balance). Please sign in your wallet to confirm.`;

      return {
        reply: summary,
        toolSummaries: [summary],
        toolActions: [
          {
            type: "buy_stock",
            summary,
            stockSymbol,
            amount,
            preparedId: result.preparedOrderId,
          },
        ],
        usedTools: true,
      };
    } catch (error: any) {
      this.logger.error(`Auto buy failed: ${error.message}`);
      return {
        reply: `Failed to prepare the ${stockSymbol} order: ${
          error.message || "unknown error"
        }`,
        toolSummaries: [],
        toolActions: [],
        usedTools: false,
      };
    }
  }
}
