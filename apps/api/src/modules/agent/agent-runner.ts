import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Logger } from "@nestjs/common";

export interface AgentRunnerConfig {
  systemPrompt: string;
  userMessage: string;
  tools?: Record<string, any>;
  logger: Logger;
  growthBalance?: number;
}

export interface AgentResult {
  reply: string;
  toolActions: Array<{
    type: "advice" | "buy_stock";
    summary: string;
    stockSymbol?: string;
    amount?: number;
    preparedId?: string;
  }>;
  toolSummaries: string[];
}

export class AgentRunner {
  static async run(config: AgentRunnerConfig): Promise<AgentResult> {
    const {
      systemPrompt,
      userMessage,
      tools,
      logger,
      growthBalance = 1000,
    } = config;

    const generateTextParams: any = {
      model: openai("gpt-4o") as any,
      system: systemPrompt,
      prompt: userMessage,
      maxTokens: 1000,
      maxSteps: 5,
    };

    if (tools && Object.keys(tools).length > 0) {
      generateTextParams.tools = tools;
      // Force tool calling if user wants to buy stocks
      const userWantsToBuy = /(?:buy|purchase|invest|recommend|stock)/i.test(
        userMessage
      );
      if (userWantsToBuy && tools.buy_stock) {
        // Force specific tool call
        generateTextParams.toolChoice = { type: "tool", toolName: "buy_stock" };
        logger.log(`🔧 Forcing buy_stock tool call`);
      }
      logger.log(
        `🔧 Passing ${Object.keys(tools).length} tools: ${Object.keys(tools).join(", ")}`
      );
    } else {
      logger.warn(`⚠️ No tools passed to generateText`);
    }

    let result: any;
    try {
      result = await generateText(generateTextParams);
    } catch (error: any) {
      logger.error(`Agent execution failed: ${error.message}`);
      throw error;
    }

    try {
      const resultKeys = Object.keys(result ?? {});
      logger.debug(
        `🤖 LLM result keys: ${resultKeys.join(", ") || "none"}; finishReason=${
          result.finishReason ?? "unknown"
        }`
      );
      if (result.steps) {
        logger.debug(
          `🤖 LLM steps: ${result.steps
            .map((s: any, idx: number) => `${idx + 1}:${s.type}`)
            .join(" | ")}`
        );
      }
    } catch (logError) {
      logger.warn(`Failed to log LLM result details: ${logError}`);
    }

    try {
      if (result?.request?.body) {
        logger.debug(
          `🤖 LLM request body: ${JSON.stringify(result.request.body).slice(0, 500)}`
        );
      }
      if (result?.response?.body) {
        logger.debug(
          `🤖 LLM response body: ${JSON.stringify(result.response.body).slice(0, 500)}`
        );
      }
    } catch (logError) {
      logger.warn(`Failed to log LLM request/response: ${logError}`);
    }

    // Process tool results
    const toolResults = result.toolResults ?? [];
    const toolCalls = result.toolCalls ?? [];
    const toolActions: AgentResult["toolActions"] = [];
    const toolSummaries: string[] = [];

    // Log tool calls
    logger.log(
      `🔧 Tool calls received: ${toolCalls.length}, Tool results: ${toolResults.length}`
    );
    if (toolCalls.length > 0) {
      toolCalls.forEach((tc: any, idx: number) => {
        logger.log(
          `  Tool ${idx + 1}: ${tc.toolName} with args: ${JSON.stringify(tc.args)}`
        );
      });
    } else {
      logger.warn(
        `⚠️ No tool calls made by AI. Check prompt and tool descriptions.`
      );
    }

    // Process tool results
    for (const tr of toolResults) {
      const name = tr.toolName ?? tr.toolId ?? "tool";
      const parsed = this.parseResult(tr.result ?? tr);
      const summary = parsed ? `${name}: ${parsed}` : `${name}: executed`;
      toolSummaries.push(summary);

      if (name === "buy_stock") {
        const toolCall = toolCalls.find(
          (tc: any) => tc.toolCallId === tr.toolCallId
        );
        const args = toolCall?.args || {};

        logger.log(
          `📊 buy_stock called: stockSymbol=${args.stockSymbol}, percentage=${args.percentage}%`
        );

        let toolResult: any = {};
        if (tr.result) {
          toolResult =
            typeof tr.result === "string" ? JSON.parse(tr.result) : tr.result;
        }

        logger.log(
          `📊 buy_stock result: success=${toolResult.success}, error=${toolResult.error || "none"}`
        );

        if (toolResult.success && toolResult.preparedOrderId) {
          const amount =
            toolResult.amount ||
            (args.percentage
              ? Math.floor((growthBalance * args.percentage) / 100)
              : 0);
          toolActions.push({
            type: "buy_stock",
            summary:
              toolResult.message ||
              `Prepared order for ${args.percentage || 0}% ($${amount}) of ${args.stockSymbol || ""}. Please sign and confirm.`,
            stockSymbol: args.stockSymbol,
            amount: amount,
            preparedId: toolResult.preparedOrderId,
          });
        } else {
          const errorMsg =
            toolResult.error ||
            `Failed to prepare order for ${args.stockSymbol || ""}`;
          logger.warn(`❌ buy_stock failed: ${errorMsg}`);
        }
      } else {
        toolActions.push({ type: "advice", summary });
      }
    }

    // Get reply text
    let replyText = (result.text?.trim() || "").trim();

    // Handle tool failures - if no reply and tool failed, use error message
    const failedToolResults = toolResults.filter((tr: any) => {
      if (tr.toolName === "buy_stock" && tr.result) {
        const toolResult =
          typeof tr.result === "string" ? JSON.parse(tr.result) : tr.result;
        return !toolResult.success;
      }
      return false;
    });

    if (
      (!replyText || replyText.trim() === "") &&
      failedToolResults.length > 0
    ) {
      const failedResult = failedToolResults[0];
      const toolResult =
        typeof failedResult.result === "string"
          ? JSON.parse(failedResult.result)
          : failedResult.result;

      if (toolResult.error) {
        replyText = toolResult.error;
        if (toolResult.availableStocks) {
          replyText += ` You can choose from: ${toolResult.availableStocks}`;
        }
      }
    }

    // Check if user wants to buy stocks but no tool was called
    const userWantsToBuy = /(?:buy|purchase|invest|recommend|stock)/i.test(
      userMessage
    );
    if (userWantsToBuy && toolCalls.length === 0 && toolActions.length === 0) {
      logger.error(
        `❌ User wants to buy stocks but no tool was called! This should not happen.`
      );
      replyText =
        "I apologize, but I'm having trouble processing your request. Please try again or specify a stock symbol and amount.";
    }

    // Ensure we have a reply
    if (!replyText || replyText.trim() === "") {
      if (toolActions.length > 0) {
        const buyStockAction = toolActions.find(
          (a) => a.type === "buy_stock" && a.preparedId
        );
        if (buyStockAction && buyStockAction.preparedId) {
          // Generate natural reply for successful buy_stock
          const percentage = buyStockAction.amount
            ? ((buyStockAction.amount / growthBalance) * 100).toFixed(1)
            : "0";
          replyText = `I've prepared an order for $${buyStockAction.amount} worth of ${buyStockAction.stockSymbol}. This represents ${percentage}% of your balance. Please sign and confirm to complete the purchase.`;
        } else {
          replyText = toolActions.map((a) => a.summary).join(". ");
        }
      } else {
        // Only use fallback if user didn't want to buy stocks
        if (!userWantsToBuy) {
          replyText =
            "I understand your request. How can I help you with your portfolio today?";
        } else {
          replyText =
            "I apologize, but I couldn't process your stock purchase request. Please try again.";
        }
      }
    }

    return {
      reply: replyText,
      toolActions,
      toolSummaries,
    };
  }

  private static parseResult(result: any): string | null {
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        return parsed.message || parsed.summary || null;
      } catch {
        return result;
      }
    }
    if (result?.message) return result.message;
    if (result?.summary) return result.summary;
    return null;
  }
}
