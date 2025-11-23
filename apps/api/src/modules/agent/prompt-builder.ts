export interface PromptContext {
  growthBalance: number;
  availableStocks: Array<{ symbol: string; name: string }>;
  userSpecifiedStock?: string | null;
  userSpecifiedAmount?: number | null;
}

export class PromptBuilder {
  static buildSystemPrompt(context: PromptContext): string {
    const {
      growthBalance,
      availableStocks,
      userSpecifiedStock,
      userSpecifiedAmount,
    } = context;

    const stockListText =
      availableStocks.length > 0
        ? availableStocks.map((s) => `- ${s.symbol}: ${s.name}`).join("\n")
        : "No stocks available";

    // Concise prompt
    const stockSymbols = availableStocks.map((s) => s.symbol).join(", ");
    return `Financial assistant. Balance: $${growthBalance.toFixed(2)}.

Available stocks: ${stockSymbols || "None"}

Rules:
- Balance query → "You have $${growthBalance.toFixed(2)}"
- Buy stocks → CALL buy_stock tool with stockSymbol and percentage (10-50%)
- Tool handles amount calculation and order preparation`;
  }

  static buildUserMessage(
    originalMessage: string,
    growthBalance: number,
    parsedInput?: { stockSymbol?: string | null; amount?: number | null }
  ): string {
    let message = originalMessage;

    if (parsedInput?.stockSymbol && parsedInput?.amount) {
      // Convert amount to percentage
      const percentage = Math.round((parsedInput.amount / growthBalance) * 100);
      message += ` [Use: ${parsedInput.stockSymbol}, ${percentage}%]`;
    } else if (parsedInput?.stockSymbol) {
      message += ` [Use stock: ${parsedInput.stockSymbol}]`;
    } else if (parsedInput?.amount) {
      const percentage = Math.round((parsedInput.amount / growthBalance) * 100);
      message += ` [Use percentage: ${percentage}%]`;
    }

    return message;
  }
}
