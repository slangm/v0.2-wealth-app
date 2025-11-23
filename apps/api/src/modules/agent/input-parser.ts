export interface ParsedUserInput {
  stockSymbol: string | null;
  amount: number | null;
  intent: "buy" | "recommend" | "balance" | "other";
}

export class InputParser {
  static parse(message: string): ParsedUserInput {
    const normalized = message.trim();
    
    // Detect intent
    const isBuyIntent = /(?:buy|purchase|invest)/i.test(normalized);
    const isRecommendIntent = /(?:recommend|suggest|what should|what to buy)/i.test(normalized);
    const isBalanceIntent = /(?:balance|how much|check.*balance)/i.test(normalized);
    
    let intent: ParsedUserInput["intent"] = "other";
    if (isBalanceIntent) {
      intent = "balance";
    } else if (isRecommendIntent) {
      intent = "recommend";
    } else if (isBuyIntent) {
      intent = "buy";
    }
    
    // Extract stock symbol and amount
    let stockSymbol: string | null = null;
    let amount: number | null = null;
    
    // Pattern 1: "buy $300 of TSLA" or "buy 300 of TSLA"
    const pattern1 = /(?:buy|purchase|invest)\s+(?:me\s+)?\$?(\d+(?:\.\d+)?)\s+of\s+([A-Z]{1,5})/i;
    let match = normalized.match(pattern1);
    if (match) {
      amount = parseFloat(match[1]);
      stockSymbol = match[2].toUpperCase();
    }
    
    // Pattern 2: "buy TSLA for $300" or "buy TSLA for 300"
    if (!stockSymbol) {
      const pattern2 = /(?:buy|purchase|invest)\s+(?:me\s+)?([A-Z]{1,5})\s+(?:for|at)\s+\$?(\d+(?:\.\d+)?)/i;
      match = normalized.match(pattern2);
      if (match) {
        stockSymbol = match[1].toUpperCase();
        amount = parseFloat(match[2]);
      }
    }
    
    // Pattern 3: "buy $300 worth of TSLA"
    if (!stockSymbol) {
      const pattern3 = /(?:buy|purchase|invest)\s+(?:me\s+)?\$?(\d+(?:\.\d+)?)\s+worth\s+of\s+([A-Z]{1,5})/i;
      match = normalized.match(pattern3);
      if (match) {
        amount = parseFloat(match[1]);
        stockSymbol = match[2].toUpperCase();
      }
    }
    
    // Pattern 4: "buy TSLA" (only stock, no amount)
    if (!stockSymbol && isBuyIntent) {
      const pattern4 = /(?:buy|purchase|invest)\s+(?:me\s+)?([A-Z]{1,5})(?:\s|$)/i;
      match = normalized.match(pattern4);
      if (match) {
        stockSymbol = match[1].toUpperCase();
      }
    }
    
    // Pattern 5: Extract amount if not found yet (e.g., "buy $300")
    if (!amount && isBuyIntent) {
      const amountPattern = /\$(\d+(?:\.\d+)?)/;
      match = normalized.match(amountPattern);
      if (match) {
        amount = parseFloat(match[1]);
      }
    }
    
    return {
      stockSymbol,
      amount,
      intent,
    };
  }
  
  static enhanceMessage(originalMessage: string, parsed: ParsedUserInput): string {
    let enhanced = originalMessage;
    
    if (parsed.stockSymbol && parsed.amount) {
      enhanced += `\n\n[CRITICAL: User wants to buy $${parsed.amount} of ${parsed.stockSymbol}. Use EXACT values.]`;
    } else if (parsed.stockSymbol) {
      enhanced += `\n\n[CRITICAL: User wants stock ${parsed.stockSymbol}. Use EXACT symbol.]`;
    } else if (parsed.amount) {
      enhanced += `\n\n[CRITICAL: User wants to invest $${parsed.amount}. Use EXACT amount.]`;
    }
    
    return enhanced;
  }
}

