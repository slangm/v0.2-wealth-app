import { tool } from "ai";
import { z } from "zod";
import { DinariUserService } from "../dinari/dinari-user.service";
import { PaymentsService } from "../payments/payments.service";
import { PortfolioService } from "../portfolio/portfolio.service";

export interface ToolContext {
  userId: string;
  growthBalance: number;
  availableStocks: Array<{ symbol: string; name: string }>;
  dinariUserService: DinariUserService;
  paymentsService?: PaymentsService;
  portfolioService?: PortfolioService;
}

export class ToolRegistry {
  static createBuyStockTool(context: ToolContext) {
    const { userId, growthBalance, availableStocks, dinariUserService } =
      context;

    const stockListText =
      availableStocks.length > 0
        ? availableStocks.map((s) => s.symbol).join(", ")
        : "No stocks available";

    return tool({
      description: `MANDATORY: Call this tool when user wants to buy stocks, invest, or asks for stock recommendations. 

This tool prepares a stock purchase order. You MUST call it when:
- User asks to buy stocks
- User asks for stock recommendations  
- User wants to invest

Rules:
- If user specifies stock: use EXACT symbol
- Use percentage (10-50% of balance) - tool calculates actual amount
- If not specified: select ONE stock from available list, use 20-30% percentage

Available stocks: ${stockListText}

After calling this tool, explain what you did to the user.`,
      parameters: z.object({
        stockSymbol: z
          .string()
          .describe(
            `Stock symbol. If user specified one, use EXACT symbol. Otherwise select ONE from: ${stockListText}`
          ),
        percentage: z
          .number()
          .min(10)
          .max(50)
          .describe(
            `Percentage of balance to invest (10-50%). Tool will calculate actual USD amount. If user specifies amount, convert to percentage. If not specified, use 20-30%.`
          ),
      }),
      execute: async ({ stockSymbol, percentage }) => {
        if (!userId) {
          return {
            success: false,
            error: "User ID not available. Please try again.",
          };
        }

        // Validate stock symbol against available stocks
        const availableSymbols = availableStocks.map((s) =>
          s.symbol.toUpperCase()
        );
        const requestedSymbol = stockSymbol.toUpperCase();

        if (!availableSymbols.includes(requestedSymbol)) {
          const availableList = availableSymbols.join(", ");
          return {
            success: false,
            error: `Stock ${stockSymbol} is not available. Available stocks are: ${availableList}.`,
            availableStocks: availableList,
          };
        }

        // Calculate actual amount from percentage
        const amount = Math.floor((growthBalance * percentage) / 100);

        // Validate calculated amount
        if (amount <= 0) {
          return {
            success: false,
            error: `Invalid percentage: ${percentage}%. Calculated amount would be $${amount}.`,
          };
        }

        if (amount > growthBalance) {
          return {
            success: false,
            error: `Percentage ${percentage}% exceeds balance. Calculated amount: $${amount}, balance: $${growthBalance.toFixed(2)}.`,
          };
        }

        try {
          const result = await dinariUserService.buyStock(
            userId,
            stockSymbol,
            amount
          );

          if (!result.preparedOrderId) {
            return {
              success: false,
              error: "Failed to prepare order. Please try again.",
            };
          }

          return {
            success: true,
            preparedOrderId: result.preparedOrderId,
            message:
              result.message ||
              `Order prepared: ${percentage}% ($${amount}) of ${stockSymbol}. Please sign and confirm.`,
            amount,
            percentage,
          };
        } catch (error: any) {
          return {
            success: false,
            error:
              error.message ||
              "Failed to prepare order. Please try again later.",
          };
        }
      },
    });
  }

  static createDepositTool(context: ToolContext) {
    const { userId, paymentsService } = context;

    if (!paymentsService) {
      return null;
    }

    return tool({
      description: `Initiate a deposit to add funds to the account. Use when user wants to add money or deposit funds.`,
      parameters: z.object({
        amount: z.number().describe("Amount in USD to deposit"),
        optionId: z
          .enum(["moonpay", "walletconnect", "mercado-pago"])
          .describe(
            "Deposit method: moonpay (card), walletconnect (on-chain), mercado-pago (cash-in)"
          ),
      }),
      execute: async ({ amount, optionId }) => {
        try {
          const result = await paymentsService.createDeposit(optionId, amount);
          return {
            success: true,
            depositId: result.id,
            status: result.status,
            message: `Deposit initiated: $${amount} via ${result.provider}. Status: ${result.status}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to initiate deposit",
          };
        }
      },
    });
  }

  static createSwapTool(context: ToolContext) {
    const { userId, portfolioService } = context;

    if (!portfolioService) {
      return null;
    }

    return tool({
      description: `Swap assets in the portfolio. Use when user wants to exchange one asset for another.`,
      parameters: z.object({
        fromAsset: z
          .string()
          .describe("Asset symbol to swap from (e.g., USDC, ETH)"),
        toAsset: z
          .string()
          .describe("Asset symbol to swap to (e.g., ETH, BTC)"),
        amount: z.number().describe("Amount in USD to swap"),
      }),
      execute: async ({ fromAsset, toAsset, amount }) => {
        try {
          // Mock swap execution - replace with real implementation
          return {
            success: true,
            swapId: `swap_${Date.now()}`,
            message: `Swap initiated: $${amount} from ${fromAsset} to ${toAsset}. This is a simulation.`,
            simulationOnly: true,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to execute swap",
          };
        }
      },
    });
  }

  static createRebalanceTool(context: ToolContext) {
    const { userId, portfolioService } = context;

    if (!portfolioService) {
      return null;
    }

    return tool({
      description: `Rebalance the portfolio allocation. Use when user wants to adjust asset allocation percentages.`,
      parameters: z.object({
        targetAllocation: z
          .record(z.string(), z.number())
          .describe(
            "Target allocation percentages by asset symbol (e.g., {SPY: 0.5, ETH: 0.3, BTC: 0.2})"
          ),
      }),
      execute: async ({ targetAllocation }) => {
        try {
          // Mock rebalance execution - replace with real implementation
          return {
            success: true,
            rebalanceId: `rebalance_${Date.now()}`,
            message: `Portfolio rebalance initiated with target allocation: ${JSON.stringify(targetAllocation)}. This is a simulation.`,
            simulationOnly: true,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || "Failed to rebalance portfolio",
          };
        }
      },
    });
  }
}
