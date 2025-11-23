import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Query,
  Param,
} from "@nestjs/common";
import { getAddress } from "viem";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { User } from "../users/user.entity";
import {
  DinariService,
  PrepareProxiedOrderParams,
  CreateProxiedOrderParams,
} from "./dinari.service";
import { DinariUserService, ConnectWalletParams } from "./dinari-user.service";

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

@Controller("dinari")
@UseGuards(JwtAuthGuard)
export class DinariController {
  constructor(
    private readonly dinariService: DinariService,
    private readonly dinariUserService: DinariUserService
  ) {}

  @Get("stocks")
  async getStocks() {
    return this.dinariService.getStocks();
  }

  @Get("account")
  async getAccount(@CurrentUser() user: User) {
    // Get cash balance from Dinari API (works even in demo mode)
    let balance = 0;
    try {
      balance = await this.dinariUserService.getAccountBalance(user.id);
    } catch (error) {
      console.error("Failed to get account balance:", error);
    }

    const accountInfo = await this.dinariUserService.getUserAccountInfo(
      user.id
    );
    if (!accountInfo) {
      return {
        accountId: null,
        walletAddress: null,
        chainId: null,
        entityId: null,
        balance: balance, // Still return balance even if account not set up (demo mode)
        message: "Dinari account not set up. Please call /dinari/setup first.",
      };
    }

    // Get additional info: wallet address and chain ID with fallbacks
    const walletAddress = await this.dinariUserService.getUserWalletAddress(
      user.id
    );
    const chainId = await this.dinariUserService.getUserChainId(user.id);

    return {
      accountId: accountInfo.accountId,
      walletAddress: walletAddress,
      chainId: chainId,
      entityId: accountInfo.entityId,
      balance: balance,
      createdAt: accountInfo.createdAt,
      updatedAt: accountInfo.updatedAt,
    };
  }

  @Post("setup")
  async setupAccount(@CurrentUser() user: User) {
    // Automatically create account for user (idempotent)
    // Wallet connection is handled separately via wallet/nonce + wallet/connect
    return this.dinariUserService.setupUserAccount(user.id);
  }

  @Get("entities")
  async getEntities() {
    return this.dinariService.getEntities();
  }

  @Get("wallet/nonce")
  async getWalletConnectionNonce(@CurrentUser() user: User) {
    // Get user's Dinari account
    const accountInfo = await this.dinariUserService.getAccountInfoWithDemo(
      user.id
    );
    if (!accountInfo?.accountId) {
      throw new Error(
        "Dinari account not set up. Please call /dinari/setup first."
      );
    }

    // Get user's wallet address and chain ID from stored data (with fallbacks)
    const walletAddress = await this.dinariUserService.getUserWalletAddress(
      user.id
    );
    const chainId = await this.dinariUserService.getUserChainId(user.id);
    return this.dinariUserService.getWalletConnectionNonce(
      user.id,
      walletAddress,
      chainId
    );
  }

  @Post("wallet/connect")
  async connectWallet(
    @CurrentUser() user: User,
    @Body() params: ConnectWalletParams
  ) {
    // Convert wallet address to checksum format (required by Dinari API)
    const checksumParams: ConnectWalletParams = {
      ...params,
      walletAddress: toChecksumAddress(params.walletAddress),
    };
    return this.dinariUserService.connectWallet(user.id, checksumParams);
  }

  @Post("wallet/link-server-side")
  async linkWalletServerSide(
    @CurrentUser() user: User,
    @Body()
    body: { walletAddress: string; chainId?: string; privateKey?: string }
  ) {
    // Server-side wallet linking (automatic signing)
    // This endpoint handles the entire flow: get nonce, sign, connect
    // Supports three signing methods (in priority order):
    // 1. privateKey parameter (not recommended for production)
    // 2. WALLET_PRIVATE_KEY environment variable
    // 3. CDP_API_KEY_NAME + CDP_API_KEY_PRIVATE_KEY
    const chainId = body.chainId || "eip155:0";
    return this.dinariUserService.linkWalletServerSide(
      user.id,
      body.walletAddress,
      chainId,
      body.privateKey
    );
  }

  @Post("orders/buy")
  async buyStock(
    @CurrentUser() user: User,
    @Body()
    body: { stockSymbol: string; amount: number; paymentTokenAddress?: string }
  ) {
    // Simplified buy interface - all internal steps are handled automatically
    // This endpoint:
    // 1. Gets stock by symbol
    // 2. Prepares proxied order
    // 3. Signs permit and order typed data using CDP wallet
    // 4. Creates proxied order
    // 5. Returns order result
    return this.dinariUserService.buyStock(
      user.id,
      body.stockSymbol,
      body.amount,
      body.paymentTokenAddress
    );
  }

  @Post("orders/confirm")
  async confirmOrder(
    @CurrentUser() user: User,
    @Body()
    body: {
      preparedProxiedOrderId: string;
      permitSignature: string;
      orderSignature: string;
    }
  ) {
    // Get user's Dinari account
    const accountInfo = await this.dinariUserService.getUserAccountInfo(
      user.id
    );
    if (!accountInfo?.accountId) {
      throw new Error(
        "Dinari account not set up. Please call /dinari/setup first."
      );
    }

    // Create proxied order with signatures
    const params = {
      accountId: accountInfo.accountId,
      preparedProxiedOrderId: body.preparedProxiedOrderId,
      permitSignature: body.permitSignature,
      orderSignature: body.orderSignature,
    };

    const orderRequest = await this.dinariService.createProxiedOrder(params);

    // Get full order details using getOrders if orderId is available
    let orderDetails: any = null;
    if (orderRequest.orderId) {
      try {
        const chainId = await this.dinariUserService.getUserChainId(user.id);
        const orders = await this.dinariService.getOrders(
          accountInfo.accountId,
          {
            chainId,
          }
        );
        // Find the order by orderId
        if (Array.isArray(orders)) {
          orderDetails = orders.find(
            (order: any) => order.id === orderRequest.orderId
          );
        } else if (orders?.data && Array.isArray(orders.data)) {
          orderDetails = orders.data.find(
            (order: any) => order.id === orderRequest.orderId
          );
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      }
    }

    // Save transaction record with order details
    try {
      let stockSymbol = "";
      if (orderDetails?.stock_id) {
        try {
          const stocks = await this.dinariService.getStocks();
          const stock = stocks.find((s) => s.id === orderDetails.stock_id);
          stockSymbol = stock?.symbol || "";
        } catch (error) {
          console.error("Failed to fetch stock symbol:", error);
        }
      }

      await this.dinariUserService.saveTransaction({
        userId: user.id,
        accountId: accountInfo.accountId,
        orderId: orderRequest.orderId,
        stockSymbol: stockSymbol,
        orderType: (orderDetails?.order_type?.toLowerCase() === "limit" ||
        orderRequest.orderType?.toLowerCase() === "limit"
          ? "limit"
          : "market") as "market" | "limit",
        side: (orderDetails?.order_side?.toLowerCase() === "sell" ||
        orderRequest.orderSide?.toLowerCase() === "sell"
          ? "sell"
          : "buy") as "buy" | "sell",
        amount: orderDetails?.payment_token_quantity || 0,
        status: (orderRequest.status === "SUBMITTED"
          ? "completed"
          : "pending") as "pending" | "completed" | "failed" | "cancelled",
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error("Failed to save transaction:", error);
    }

    return {
      success: true,
      orderRequestId: orderRequest.id,
      orderId: orderRequest.orderId,
      status: orderRequest.status,
      orderDetails: orderDetails,
      message: `Order ${orderRequest.status === "SUBMITTED" ? "submitted" : "pending"} successfully`,
    };
  }

  // Internal endpoints (kept for backward compatibility, but not recommended for direct use)
  @Post("orders/prepare")
  async prepareProxiedOrder(
    @CurrentUser() user: User,
    @Body()
    body: Omit<PrepareProxiedOrderParams, "accountId" | "chainId"> & {
      amount?: number;
      chainId?: string;
    }
  ) {
    // Get user's Dinari account
    const accountInfo = await this.dinariUserService.getUserAccountInfo(
      user.id
    );
    if (!accountInfo?.accountId) {
      throw new Error(
        "Dinari account not set up. Please call /dinari/setup first."
      );
    }

    // Get user's chain ID from stored data (fallback to Ethereum Sepolia)
    const chainId =
      body.chainId ||
      (await this.dinariUserService.getUserChainId(user.id)) ||
      process.env.DINARI_CHAIN_ID ||
      "eip155:11155111";

    // Payment token defaults to Ethereum Sepolia unless provided
    const paymentToken =
      body.paymentToken ||
      process.env.DINARI_PAYMENT_TOKEN ||
      "0x665b099132d79739462DfDe6874126AFe840F7a3";
    const checksumPaymentToken = toChecksumAddress(paymentToken);

    // Use user's account ID and chain ID
    const params: PrepareProxiedOrderParams = {
      ...body,
      accountId: accountInfo.accountId,
      chainId: chainId,
      paymentToken: checksumPaymentToken,
      paymentTokenQuantity: body.paymentTokenQuantity ?? body.amount,
      orderSide: body.orderSide || "BUY",
      orderType: body.orderType || "MARKET",
      orderTif: body.orderTif || "DAY",
    };

    return this.dinariService.prepareProxiedOrder(params);
  }

  @Post("orders/create")
  async createProxiedOrder(
    @CurrentUser() user: User,
    @Body() body: Omit<CreateProxiedOrderParams, "accountId">
  ) {
    // Get user's Dinari account
    const accountInfo = await this.dinariUserService.getUserAccountInfo(
      user.id
    );
    if (!accountInfo?.accountId) {
      throw new Error(
        "Dinari account not set up. Please call /dinari/setup first."
      );
    }

    // Use user's account ID
    const params: CreateProxiedOrderParams = {
      ...body,
      accountId: accountInfo.accountId,
    };

    return this.dinariService.createProxiedOrder(params);
  }

  @Post("faucet")
  async requestFaucet(@CurrentUser() user: User) {
    // Get user's Dinari account
    const accountInfo = await this.dinariUserService.getUserAccountInfo(
      user.id
    );
    if (!accountInfo?.accountId) {
      throw new Error(
        "Dinari account not set up. Please call /dinari/setup first."
      );
    }

    // Get user's chain ID from stored data (fallback to eip155:0)
    const chainId = await this.dinariUserService.getUserChainId(user.id);
    return this.dinariService.sandboxFaucet(accountInfo.accountId, chainId);
  }

  @Get("stocks/random")
  async getRandomStocks(@Query("count") count?: string) {
    const countNum = count ? parseInt(count, 10) : 3;
    return this.dinariService.getRandomStocks(countNum);
  }

  @Get("orders")
  async getOrders(
    @CurrentUser() user: User,
    @Query("order_transaction_hash") orderTransactionHash?: string,
    @Query("page") page?: string,
    @Query("page_size") pageSize?: string
  ) {
    // Get user's Dinari account
    const accountInfo = await this.dinariUserService.getUserAccountInfo(
      user.id
    );
    if (!accountInfo?.accountId) {
      throw new Error(
        "Dinari account not set up. Please call /dinari/setup first."
      );
    }

    // Get user's chain ID from stored data (fallback to eip155:0)
    const chainId = await this.dinariUserService.getUserChainId(user.id);

    return this.dinariService.getOrders(accountInfo.accountId, {
      chainId,
      orderTransactionHash,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get("orders/:orderId/fulfillments")
  async getOrderFulfillments(
    @CurrentUser() user: User,
    @Param("orderId") orderId: string,
    @Query("page") page?: string,
    @Query("page_size") pageSize?: string
  ) {
    // Get user's Dinari account
    const accountInfo = await this.dinariUserService.getUserAccountInfo(
      user.id
    );
    if (!accountInfo?.accountId) {
      throw new Error(
        "Dinari account not set up. Please call /dinari/setup first."
      );
    }

    return this.dinariService.getOrderFulfillments(
      accountInfo.accountId,
      orderId,
      {
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      }
    );
  }

  @Get("order-fulfillments")
  async queryOrderFulfillments(
    @CurrentUser() user: User,
    @Query("order_ids") orderIds?: string,
    @Query("page") page?: string,
    @Query("page_size") pageSize?: string
  ) {
    // Get user's Dinari account
    const accountInfo = await this.dinariUserService.getUserAccountInfo(
      user.id
    );
    if (!accountInfo?.accountId) {
      throw new Error(
        "Dinari account not set up. Please call /dinari/setup first."
      );
    }

    // Parse order_ids from query string (can be comma-separated or array)
    const orderIdsArray = orderIds
      ? orderIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined;

    return this.dinariService.queryOrderFulfillments(accountInfo.accountId, {
      orderIds: orderIdsArray,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }
}
