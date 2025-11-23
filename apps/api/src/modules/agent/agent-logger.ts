import { Logger } from "@nestjs/common";

export class AgentLogger {
  constructor(private readonly logger: Logger) {}
  
  logRequest(context: {
    message: string;
    growthBalance: number;
    availableStocks: Array<{ symbol: string; name: string }>;
    parsedInput?: { stockSymbol?: string | null; amount?: number | null };
  }) {
    this.logger.log("=".repeat(80));
    this.logger.log("📤 Agent Request:");
    this.logger.log("=".repeat(80));
    this.logger.log(`💬 Message: ${context.message.substring(0, 100)}${context.message.length > 100 ? "..." : ""}`);
    this.logger.log(`💰 Balance: $${context.growthBalance.toFixed(2)}`);
    this.logger.log(`📊 Available Stocks: ${context.availableStocks.length}`);
    if (context.parsedInput?.stockSymbol) {
      this.logger.log(`🎯 Parsed Stock: ${context.parsedInput.stockSymbol}`);
    }
    if (context.parsedInput?.amount) {
      this.logger.log(`💵 Parsed Amount: $${context.parsedInput.amount}`);
    }
    this.logger.log("=".repeat(80));
  }
  
  logResponse(result: {
    reply: string;
    toolActions: any[];
    toolSummaries: string[];
  }) {
    this.logger.log("=".repeat(80));
    this.logger.log("📥 Agent Response:");
    this.logger.log("=".repeat(80));
    this.logger.log(`💬 Reply: ${result.reply.substring(0, 200)}${result.reply.length > 200 ? "..." : ""}`);
    this.logger.log(`🔧 Tool Actions: ${result.toolActions.length}`);
    if (result.toolActions.length > 0) {
      result.toolActions.forEach((action, idx) => {
        this.logger.log(`  ${idx + 1}. ${action.type}: ${action.summary}`);
      });
    }
    this.logger.log("=".repeat(80));
  }
}

