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
    const accountInfo = await this.dinariUserService.getUserAccountInfo(
      user.id
    );
    if (!accountInfo) {
      return {
        accountId: null,
        walletAddress: null,
        chainId: null,
        entityId: null,
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
    const accountInfo = await this.dinariUserService.getUserAccountInfo(
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
    @Body() body: { walletAddress: string; chainId?: string; privateKey?: string }
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
    @Body() body: { stockSymbol: string; amount: number }
  ) {
    // Alias for buyStock - user confirms the order and it's executed automatically
    return this.dinariUserService.buyStock(
      user.id,
      body.stockSymbol,
      body.amount
    );
  }

  // Internal endpoints (kept for backward compatibility, but not recommended for direct use)
  @Post("orders/prepare")
  async prepareProxiedOrder(
    @CurrentUser() user: User,
    @Body()
    body: Omit<PrepareProxiedOrderParams, "accountId" | "chainId"> & {
      amount?: number
      chainId?: string
    },
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
    const chainId =
      body.chainId ||
      (await this.dinariUserService.getUserChainId(user.id)) ||
      process.env.DINARI_CHAIN_ID ||
      "eip155:8453";

    // Payment token defaults to Base USDC on sandbox/mainnet unless provided
    const paymentToken =
      body.paymentToken ||
      process.env.DINARI_PAYMENT_TOKEN ||
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913";
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
