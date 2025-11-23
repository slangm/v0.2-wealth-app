import { Injectable, Logger } from "@nestjs/common";
import { getAddress } from "viem";
import Dinari from "@dinari/api-sdk";

const DINARI_API_BASE =
  process.env.DINARI_BASE_URL ||
  "https://api-enterprise.sandbox.dinari.com/api/v2";
const DINARI_API_KEY_ID = process.env.DINARI_API_KEY_ID || "";
const DINARI_API_SECRET_KEY =
  process.env.DINARI_SECRET_KEY || process.env.DINARI_API_SECRET_KEY || "";
const DINARI_API_ENTITY_ID = process.env.DINARI_API_ENTITY_ID || "";

/**
 * Convert address to checksum format (required by Dinari API)
 */
function toChecksumAddress(address: string): string {
  try {
    return getAddress(address);
  } catch (error) {
    throw new Error(`Invalid address format: ${address}`);
  }
}

export type DinariStock = {
  id: string;
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  currentPrice?: number;
  dayChangePct?: number;
};

export type DinariAccount = {
  id: string;
  entityId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DinariOrderRequest = {
  accountId: string;
  stockSymbol: string;
  quantity?: number;
  amount?: number; // USD amount for market orders
  orderType: "market" | "limit";
  side: "buy" | "sell";
  limitPrice?: number; // Required for limit orders
};

export type PrepareProxiedOrderParams = {
  accountId: string;
  chainId: string; // CAIP-2 chain ID (e.g., "eip155:1")
  orderTif: "DAY" | "GTC" | "IOC" | "FOK";
  orderSide: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  stockId: string; // UUID of the stock
  paymentToken: string; // Address of payment token
  paymentTokenQuantity?: number; // Required for market buy orders
  assetTokenQuantity?: number; // Required for limit orders and market sell orders
  limitPrice?: number; // Required for limit orders
};

export type PreparedProxiedOrder = {
  id: string; // UUID
  deadline: string; // ISO 8601 timestamp
  permitTypedData: {
    domain: any;
    types: any;
    message: any;
    primaryType: string;
  };
  orderTypedData: {
    domain: any;
    types: any;
    message: any;
    primaryType: string;
  };
  fees: Array<{
    type: string;
    feeInWei: string;
    feeInEth: number;
  }>;
};

export type CreateProxiedOrderParams = {
  accountId: string;
  preparedProxiedOrderId: string; // UUID
  permitSignature: string; // Signature of permit typed data
  orderSignature: string; // Signature of order typed data
};

export type ProxiedOrderRequest = {
  id: string; // UUID - OrderRequest ID
  accountId: string;
  recipientAccountId?: string | null;
  status:
    | "QUOTED"
    | "PENDING"
    | "PENDING_BRIDGE"
    | "SUBMITTED"
    | "ERROR"
    | "CANCELLED";
  createdDt: string; // ISO 8601 timestamp
  orderSide: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  orderTif: "DAY" | "GTC" | "IOC" | "FOK";
  orderId?: string; // UUID - Order ID (if order was created)
};

@Injectable()
export class DinariService {
  private readonly logger = new Logger(DinariService.name);
  private stocksCache: { data: DinariStock[]; ts: number } | null = null;
  private readonly cacheMs = 1000 * 60 * 5; // 5 minutes
  private readonly client: Dinari;

  constructor() {
    this.client = new Dinari({
      apiKeyID: DINARI_API_KEY_ID,
      apiSecretKey: DINARI_API_SECRET_KEY,
      baseURL: DINARI_API_BASE,
    });

    if (!DINARI_API_KEY_ID || !DINARI_API_SECRET_KEY) {
      this.logger.warn(
        `⚠️  Dinari API credentials missing! X-API-Key-Id=${DINARI_API_KEY_ID ? "***" + DINARI_API_KEY_ID.slice(-4) : "NOT SET"}, X-API-Secret-Key=${DINARI_API_SECRET_KEY ? "***SET***" : "NOT SET"}`
      );
    } else {
      this.logger.log(
        `✅ Dinari SDK initialized: baseURL=${DINARI_API_BASE}, X-API-Key-Id=***${DINARI_API_KEY_ID.slice(-4)}`
      );
    }
  }

  private getHeaders() {
    // Dinari API authentication uses X-API-Key-Id and X-API-Secret-Key headers
    // Reference: https://docs.dinari.com
    const headers: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
    };

    // Check environment variables (support multiple names)
    const apiKeyId = DINARI_API_KEY_ID || process.env.DINARI_API_KEY_ID || "";
    const apiSecretKey =
      DINARI_API_SECRET_KEY ||
      process.env.DINARI_API_SECRET_KEY ||
      process.env.DINARI_SECRET_KEY ||
      "";

    if (apiKeyId) {
      headers["X-API-Key-Id"] = apiKeyId;
    }
    if (apiSecretKey) {
      headers["X-API-Secret-Key"] = apiSecretKey;
    }

    // Log headers configuration (without sensitive values) - only log once per request
    if (!apiKeyId || !apiSecretKey) {
      this.logger.warn(
        `⚠️  Dinari API credentials missing! X-API-Key-Id=${apiKeyId ? "***" + apiKeyId.slice(-4) : "NOT SET"}, X-API-Secret-Key=${apiSecretKey ? "***SET***" : "NOT SET"}`
      );
      this.logger.warn(
        `Please set environment variables: DINARI_API_KEY_ID and DINARI_SECRET_KEY (or DINARI_API_SECRET_KEY)`
      );
    } else {
      this.logger.debug(
        `Dinari API Config: X-API-Key-Id=***${apiKeyId.slice(-4)}, X-API-Secret-Key=***SET***`
      );
    }

    return headers;
  }

  /**
   * Wrapper for fetch that logs all requests and responses
   */
  private async fetchWithLogging(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const method = options.method || "GET";
    const headers = (options.headers as Record<string, string>) || {};
    const body = options.body;

    // Log request
    this.logger.log(`[Dinari API Request] ${method} ${url}`);
    this.logger.debug(
      `[Dinari API Headers] ${JSON.stringify(
        Object.keys(headers).reduce(
          (acc, key) => {
            const lowerKey = key.toLowerCase();
            if (
              lowerKey.includes("secret") ||
              lowerKey.includes("key") ||
              lowerKey === "x-api-secret-key"
            ) {
              acc[key] = "***HIDDEN***";
            } else if (lowerKey === "x-api-key-id") {
              // Show last 4 chars of key ID
              acc[key] =
                headers[key] && headers[key].length > 4
                  ? "***" + headers[key].slice(-4)
                  : "***";
            } else {
              acc[key] = headers[key];
            }
            return acc;
          },
          {} as Record<string, string>
        )
      )}`
    );
    if (body) {
      const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
      this.logger.debug(
        `[Dinari API Body] ${bodyStr.substring(0, 200)}${bodyStr.length > 200 ? "..." : ""}`
      );
    }

    // Make request
    const resp = await fetch(url, options);

    // Read response
    const responseText = await resp.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Log response
    this.logger.log(
      `[Dinari API Response] ${method} ${url} - Status: ${resp.status} ${resp.statusText}`
    );
    const responseStr =
      typeof responseData === "string"
        ? responseData
        : JSON.stringify(responseData);
    this.logger.debug(
      `[Dinari API Response Body] ${responseStr.substring(0, 500)}${responseStr.length > 500 ? "..." : ""}`
    );

    // Return a new Response with the text (since we already read it)
    return new Response(responseText, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    });
  }

  /**
   * Get all available stocks from Dinari
   * Reference: https://docs.dinari.com/reference/getstocks
   */
  async getStocks(): Promise<DinariStock[]> {
    const now = Date.now();
    if (this.stocksCache && now - this.stocksCache.ts < this.cacheMs) {
      return this.stocksCache.data;
    }

    try {
      this.logger.log(
        `Fetching stocks from Dinari API: ${DINARI_API_BASE}/market_data/stocks`
      );
      const headers = this.getHeaders();
      const response = await fetch(`${DINARI_API_BASE}/market_data/stocks`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Dinari API error: ${response.status} ${response.statusText} - ${errorText}`
        );
        throw new Error(
          `Failed to fetch stocks: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      // Handle both array and object responses
      const stocks = Array.isArray(data)
        ? data
        : data.data || data.stocks || [];
      this.logger.log(`📊 Received ${stocks.length} stocks from API`);

      // Filter stocks that support Ethereum Sepolia (eip155:11155111) for Growth Portfolio
      const targetChain = "eip155:11155111";
      const supportedStocks = stocks.filter((stock: any) => {
        const tokens = stock.tokens || [];
        const hasTargetChain = tokens.some((token: string) =>
          token.startsWith(targetChain + ":")
        );
        return hasTargetChain;
      });

      this.logger.log(
        `✅ Filtered ${supportedStocks.length} stocks supporting ${targetChain} (from ${stocks.length} total)`
      );

      const formatted: DinariStock[] = supportedStocks.map((stock: any) => ({
        id: stock.id || stock.symbol,
        symbol: stock.symbol,
        name: stock.display_name || stock.name || stock.symbol,
        exchange: stock.exchange,
        currency: stock.currency || "USD",
        currentPrice: stock.current_price || stock.price,
        dayChangePct: stock.day_change_pct || stock.change_percent,
      }));

      this.stocksCache = { data: formatted, ts: now };
      this.logger.log(
        `✅ Cached ${formatted.length} stocks (filtered for ${targetChain})`
      );
      return formatted;
    } catch (error) {
      this.logger.error(`Error fetching Dinari stocks: ${error}`);
      return [];
    }
  }

  /**
   * Get accounts for an entity
   * Reference: https://docs.dinari.com/reference/getentityaccounts
   */
  async getAccountsForEntity(entityId: string): Promise<DinariAccount[]> {
    try {
      const url = `${DINARI_API_BASE}/entities/${entityId}/accounts`;
      const headers = this.getHeaders();

      const resp = await this.fetchWithLogging(url, {
        method: "GET",
        headers,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to fetch Dinari accounts: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }
      const accounts = Array.isArray(data) ? data : data.results || [];

      return accounts.map((acc: any) => ({
        id: acc.id,
        entityId: acc.entity_id || entityId,
        status: acc.status,
        createdAt: acc.created_at || acc.createdAt,
        updatedAt: acc.updated_at || acc.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`Error fetching Dinari accounts: ${error}`);
      throw error;
    }
  }

  /**
   * Get a specific stock by symbol
   */
  async getStockBySymbol(symbol: string): Promise<DinariStock | null> {
    const stocks = await this.getStocks();
    return (
      stocks.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase()) ||
      null
    );
  }

  /**
   * Validate if a stock symbol is available
   */
  async validateStock(symbol: string): Promise<boolean> {
    const stock = await this.getStockBySymbol(symbol);
    return stock !== null;
  }

  /**
   * Create a market buy order for Dinari stock
   * Reference: https://docs.dinari.com/reference/createmarketbuymanagedorderrequest
   */
  async createMarketBuyOrder(params: {
    accountId: string;
    stockSymbol: string;
    amount: number; // USD amount to spend
  }): Promise<any> {
    try {
      const url = `${DINARI_API_BASE}/managed_orders/market_buy`;
      this.logger.log(
        `Creating market buy order for ${params.stockSymbol} with $${params.amount}`
      );

      const headers = this.getHeaders();
      const body = JSON.stringify({
        account_id: params.accountId,
        stock_symbol: params.stockSymbol,
        amount: params.amount,
      });
      const resp = await this.fetchWithLogging(url, {
        method: "POST",
        headers,
        body,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to create Dinari order: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }
      this.logger.log(`Order created: ${data.id || "unknown"}`);
      return data;
    } catch (error) {
      this.logger.error(`Error creating Dinari order: ${error}`);
      throw error;
    }
  }

  /**
   * Get available stocks formatted for AI agent context
   */
  async getStocksForAgent(): Promise<string> {
    const stocks = await this.getStocks();
    if (stocks.length === 0) {
      return "No Dinari stocks available.";
    }

    // Return top 50 stocks as a formatted string for AI context
    const topStocks = stocks.slice(0, 50);
    const stockList = topStocks
      .map(
        (s) =>
          `${s.symbol} (${s.name})${s.currentPrice ? ` - $${s.currentPrice}` : ""}`
      )
      .join(", ");

    return `Available Dinari stocks (${stocks.length} total): ${stockList}${stocks.length > 50 ? "..." : ""}`;
  }

  /**
   * Get wallet connection nonce
   * Reference: GET /accounts/{account_id}/wallet/external/nonce
   */
  async getWalletConnectionNonce(
    accountId: string,
    walletAddress: string,
    chainId: string = "eip155:0"
  ): Promise<{ nonce: string; message: string }> {
    try {
      const checksumAddress = toChecksumAddress(walletAddress);
      this.logger.log(
        `Getting nonce for wallet ${checksumAddress} on chain ${chainId}`
      );

      const url = `${DINARI_API_BASE}/accounts/${accountId}/wallet/external/nonce?wallet_address=${checksumAddress}&chain_id=${encodeURIComponent(chainId)}`;
      const headers = this.getHeaders();
      const resp = await this.fetchWithLogging(url, {
        method: "GET",
        headers,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to get nonce: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }

      this.logger.log(`✅ Got nonce for wallet ${checksumAddress}`);
      return {
        nonce: data.nonce,
        message: data.message,
      };
    } catch (error) {
      this.logger.error(`Error getting nonce: ${error}`);
      throw error;
    }
  }

  /**
   * Connect external wallet to account
   * Reference: POST /accounts/{account_id}/wallet/external
   * Note: Requires signature from wallet. Use getWalletConnectionNonce first.
   */
  async connectExternalWallet(
    accountId: string,
    walletAddress: string,
    chainId: string,
    signature: string,
    nonce: string
  ): Promise<any> {
    try {
      const checksumAddress = toChecksumAddress(walletAddress);
      this.logger.log(
        `Connecting wallet ${checksumAddress} to account ${accountId} on chain ${chainId}`
      );

      const url = `${DINARI_API_BASE}/accounts/${accountId}/wallet/external`;
      const headers = this.getHeaders();
      const body = JSON.stringify({
        signature,
        nonce,
        wallet_address: checksumAddress,
        chain_id: chainId,
      });
      const resp = await this.fetchWithLogging(url, {
        method: "POST",
        headers,
        body,
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        this.logger.error(
          `Failed to connect wallet: ${resp.status} - ${errorText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${errorText}`);
      }

      const data = await resp.json();
      this.logger.log(`✅ Wallet connected: ${data.address || walletAddress}`);
      return data;
    } catch (error) {
      this.logger.error(`Error connecting wallet: ${error}`);
      throw error;
    }
  }

  /**
   * Create external wallet for account (legacy method - kept for backward compatibility)
   * This method is deprecated. Use getWalletConnectionNonce + connectExternalWallet instead.
   * @deprecated Use getWalletConnectionNonce and connectExternalWallet instead
   */
  async createExternalWallet(
    accountId: string,
    chainId: string = "eip155:1" // Ethereum mainnet by default
  ): Promise<any> {
    this.logger.warn(
      "createExternalWallet is deprecated. Use getWalletConnectionNonce + connectExternalWallet instead."
    );
    // This method cannot work without signature, so we'll throw an error
    throw new Error(
      "createExternalWallet requires wallet signature. Use getWalletConnectionNonce + connectExternalWallet instead."
    );
  }

  /**
   * Create account for entity
   * Reference: POST /entities/{entity_id}/accounts
   */
  async createAccountForEntity(entityId: string): Promise<any> {
    try {
      this.logger.log(`Creating account for entity ${entityId}`);
      const account = await this.client.v2.entities.accounts.create(entityId);
      this.logger.log(`✅ Account created: ${account.id}`);
      return account;
    } catch (error) {
      this.logger.error(`Error creating account: ${error}`);
      throw error;
    }
  }

  /**
   * Get wallet for account
   * Reference: GET /accounts/{account_id}/wallet
   */
  async getWalletForAccount(accountId: string): Promise<any> {
    try {
      const url = `${DINARI_API_BASE}/accounts/${accountId}/wallet`;
      this.logger.log(`Fetching wallet for account ${accountId}`);

      const headers = this.getHeaders();
      const resp = await this.fetchWithLogging(url, {
        method: "GET",
        headers,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to fetch wallet: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Error fetching wallet: ${error}`);
      throw error;
    }
  }

  /**
   * Get cash balance for account
   * Reference: GET /accounts/{account_id}/cash
   */
  async getCashBalance(accountId: string): Promise<number> {
    try {
      const url = `${DINARI_API_BASE}/accounts/${accountId}/cash`;
      this.logger.log(`Fetching cash balance from ${url}`);

      const headers = this.getHeaders();
      const resp = await this.fetchWithLogging(url, {
        method: "GET",
        headers,
      });

      const responseText = await resp.text();
      this.logger.debug(
        `Cash API response status: ${resp.status}, body: ${responseText}`
      );

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error(
          `Failed to parse cash balance response: ${parseError}. Raw response: ${responseText}`
        );
        throw new Error(`Failed to parse cash balance response: ${parseError}`);
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to fetch cash balance: ${resp.status} ${resp.statusText} - ${responseText}`
        );
        throw new Error(
          `Dinari API error: ${resp.status} ${resp.statusText} - ${responseText}`
        );
      }

      // Handle array response: find the balance for eip155:11155111
      if (Array.isArray(data) && data.length > 0) {
        this.logger.debug(
          `Cash API returned array with ${data.length} entries`
        );
        const targetChain = "eip155:11155111";
        const cashEntry = data.find(
          (entry: any) => entry.chain_id === targetChain
        );
        if (cashEntry?.amount) {
          const balance = parseFloat(cashEntry.amount);
          this.logger.log(
            `✅ Found cash balance for ${targetChain}: $${balance}`
          );
          return balance;
        }
        // Fallback to first entry if target chain not found
        if (data[0]?.amount) {
          const balance = parseFloat(data[0].amount);
          this.logger.warn(
            `⚠️ Target chain ${targetChain} not found, using first entry: $${balance}`
          );
          return balance;
        }
        this.logger.warn(
          `⚠️ Array response has no amount field. Data: ${JSON.stringify(data)}`
        );
      } else if (data && typeof data === "object") {
        // Handle single object response
        if (data.amount) {
          const balance = parseFloat(data.amount);
          this.logger.log(`✅ Found cash balance: $${balance}`);
          return balance;
        }
        this.logger.warn(
          `⚠️ Object response has no amount field. Data: ${JSON.stringify(data)}`
        );
      } else {
        this.logger.warn(
          `⚠️ Unexpected response format. Data: ${JSON.stringify(data)}`
        );
      }

      this.logger.warn(`No valid cash balance found in response, returning 0`);
      return 0;
    } catch (error) {
      this.logger.error(
        `Error fetching cash balance for account ${accountId}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Get all entities
   * Reference: GET /entities
   */
  async getEntities(): Promise<any[]> {
    try {
      this.logger.log(`Fetching entities from Dinari SDK`);
      const entities = await this.client.v2.entities.list();
      this.logger.log(`✅ Fetched ${entities.length} entities`);
      return entities;
    } catch (error) {
      this.logger.error(`Error fetching entities: ${error}`);
      throw error;
    }
  }

  /**
   * Get current entity (from env var, or first entity from API)
   */
  async getCurrentEntity(): Promise<string | null> {
    // First check if entity ID is provided via environment variable
    if (DINARI_API_ENTITY_ID) {
      this.logger.log(
        `Using entity ID from environment: ${DINARI_API_ENTITY_ID}`
      );
      return DINARI_API_ENTITY_ID;
    }

    // Otherwise, fetch from API
    try {
      const entities = await this.getEntities();
      if (entities.length === 0) {
        this.logger.warn("No entities found");
        return null;
      }
      // Return the first entity ID
      const entityId = entities[0].id || entities[0].entity_id || null;
      if (entityId) {
        this.logger.log(`Using entity ID from API: ${entityId}`);
      }
      return entityId;
    } catch (error) {
      this.logger.error(`Error getting current entity: ${error}`);
      return null;
    }
  }

  /**
   * Prepare a proxied order to be placed on EVM
   * Reference: POST /accounts/{account_id}/order_requests/stocks/eip155/prepare
   */
  async prepareProxiedOrder(
    params: PrepareProxiedOrderParams
  ): Promise<PreparedProxiedOrder> {
    try {
      // Ensure payment token address is in checksum format (required by Dinari API)
      const checksumPaymentToken = toChecksumAddress(params.paymentToken);
      const url = `${DINARI_API_BASE}/accounts/${params.accountId}/order_requests/stocks/eip155/prepare`;
      this.logger.log(
        `Preparing proxied order for account ${params.accountId}, stock ${params.stockId}`
      );

      const body: any = {
        chain_id: params.chainId,
        order_tif: params.orderTif,
        order_side: params.orderSide,
        order_type: params.orderType,
        stock_id: params.stockId,
        payment_token: checksumPaymentToken,
      };

      if (params.paymentTokenQuantity !== undefined) {
        body.payment_token_quantity = params.paymentTokenQuantity;
      }
      if (params.assetTokenQuantity !== undefined) {
        body.asset_token_quantity = params.assetTokenQuantity;
      }
      if (params.limitPrice !== undefined) {
        body.limit_price = params.limitPrice;
      }

      const headers = this.getHeaders();
      const bodyStr = JSON.stringify(body);
      const resp = await this.fetchWithLogging(url, {
        method: "POST",
        headers,
        body: bodyStr,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to prepare proxied order: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }
      this.logger.log(`Prepared proxied order: ${data.id}`);
      return data;
    } catch (error) {
      this.logger.error(`Error preparing proxied order: ${error}`);
      throw error;
    }
  }

  /**
   * Create a proxied order on EVM from a prepared proxied order
   * Reference: POST /accounts/{account_id}/order_requests/stocks/eip155
   */
  async createProxiedOrder(
    params: CreateProxiedOrderParams
  ): Promise<ProxiedOrderRequest> {
    try {
      const url = `${DINARI_API_BASE}/accounts/${params.accountId}/order_requests/stocks/eip155`;
      this.logger.log(
        `Creating proxied order for account ${params.accountId}, prepared order ${params.preparedProxiedOrderId}`
      );

      const headers = this.getHeaders();
      const body = JSON.stringify({
        prepared_proxied_order_id: params.preparedProxiedOrderId,
        permit_signature: params.permitSignature,
        order_signature: params.orderSignature,
      });
      const resp = await this.fetchWithLogging(url, {
        method: "POST",
        headers,
        body,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to create proxied order: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }
      this.logger.log(`Created proxied order request: ${data.id}`);
      return data;
    } catch (error) {
      this.logger.error(`Error creating proxied order: ${error}`);
      throw error;
    }
  }

  /**
   * Sandbox Faucet - Mint 1,000 mockUSD to account wallet
   * Reference: POST /accounts/{account_id}/faucet
   * Only available in sandbox mode
   */
  async sandboxFaucet(
    accountId: string,
    chainId: string = "eip155:11155111"
  ): Promise<any> {
    try {
      this.logger.log(
        `Requesting sandbox faucet for account ${accountId} on chain ${chainId}`
      );

      const url = `${DINARI_API_BASE}/accounts/${accountId}/faucet`;
      const headers = this.getHeaders();
      const body = JSON.stringify({
        chain_id: chainId,
      });
      const resp = await this.fetchWithLogging(url, {
        method: "POST",
        headers,
        body,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to request sandbox faucet: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }
      this.logger.log(`✅ Sandbox faucet successful for account ${accountId}`);
      return data;
    } catch (error) {
      this.logger.error(`Error requesting sandbox faucet: ${error}`);
      throw error;
    }
  }

  /**
   * Get random stocks from the available stock list
   * Returns 3 random stocks for AI to choose from
   */
  async getRandomStocks(count: number = 3): Promise<DinariStock[]> {
    const stocks = await this.getStocks();
    if (stocks.length === 0) {
      return [];
    }

    // Shuffle and pick random stocks
    const shuffled = [...stocks].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, stocks.length));
  }

  /**
   * Get orders for an account
   * Reference: GET /accounts/{account_id}/orders
   */
  async getOrders(
    accountId: string,
    params?: {
      chainId?: string;
      orderTransactionHash?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.chainId) {
        queryParams.append("chain_id", params.chainId);
      }
      if (params?.orderTransactionHash) {
        queryParams.append(
          "order_transaction_hash",
          params.orderTransactionHash
        );
      }
      if (params?.page) {
        queryParams.append("page", params.page.toString());
      }
      if (params?.pageSize) {
        queryParams.append("page_size", params.pageSize.toString());
      }

      const url = `${DINARI_API_BASE}/accounts/${accountId}/orders${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      this.logger.log(`Fetching orders for account ${accountId}`);

      const headers = this.getHeaders();
      const resp = await this.fetchWithLogging(url, {
        method: "GET",
        headers,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to fetch orders: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }
      this.logger.log(`Fetched orders for account ${accountId}`);
      return data;
    } catch (error) {
      this.logger.error(`Error fetching orders: ${error}`);
      throw error;
    }
  }

  /**
   * Get order fulfillments for a specific order
   * Reference: GET /accounts/{account_id}/orders/{order_id}/fulfillments
   */
  async getOrderFulfillments(
    accountId: string,
    orderId: string,
    params?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) {
        queryParams.append("page", params.page.toString());
      }
      if (params?.pageSize) {
        queryParams.append("page_size", params.pageSize.toString());
      }

      const url = `${DINARI_API_BASE}/accounts/${accountId}/orders/${orderId}/fulfillments${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      this.logger.log(
        `Fetching fulfillments for order ${orderId} in account ${accountId}`
      );

      const headers = this.getHeaders();
      const resp = await this.fetchWithLogging(url, {
        method: "GET",
        headers,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to fetch order fulfillments: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }
      this.logger.log(
        `Fetched fulfillments for order ${orderId} in account ${accountId}`
      );
      return data;
    } catch (error) {
      this.logger.error(`Error fetching order fulfillments: ${error}`);
      throw error;
    }
  }

  /**
   * Query order fulfillments for an account
   * Reference: GET /accounts/{account_id}/order_fulfillments
   */
  async queryOrderFulfillments(
    accountId: string,
    params?: {
      orderIds?: string[];
      page?: number;
      pageSize?: number;
    }
  ): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.orderIds && params.orderIds.length > 0) {
        // Dinari API expects order_ids as array query parameter
        params.orderIds.forEach((id) => {
          queryParams.append("order_ids", id);
        });
      }
      if (params?.page) {
        queryParams.append("page", params.page.toString());
      }
      if (params?.pageSize) {
        queryParams.append("page_size", params.pageSize.toString());
      }

      const url = `${DINARI_API_BASE}/accounts/${accountId}/order_fulfillments${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      this.logger.log(`Querying order fulfillments for account ${accountId}`);

      const headers = this.getHeaders();
      const resp = await this.fetchWithLogging(url, {
        method: "GET",
        headers,
      });

      const responseText = await resp.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!resp.ok) {
        this.logger.error(
          `Failed to query order fulfillments: ${resp.status} - ${responseText}`
        );
        throw new Error(`Dinari API error: ${resp.status} - ${responseText}`);
      }
      this.logger.log(`Queried order fulfillments for account ${accountId}`);
      return data;
    } catch (error) {
      this.logger.error(`Error querying order fulfillments: ${error}`);
      throw error;
    }
  }
}
