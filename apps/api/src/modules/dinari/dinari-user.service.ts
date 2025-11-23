import { Injectable, Logger } from "@nestjs/common";
import { getAddress } from "viem";
import { CdpWalletProvider } from "@coinbase/agentkit";
import { DinariService } from "./dinari.service";
import {
  DinariStorageService,
  type DinariUserData,
} from "./dinari-storage.service";
import { WalletService } from "../wallet/wallet.service";

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

export type SetupDinariAccountResult = {
  success: boolean;
  entityId?: string;
  accountId?: string;
  walletAddress?: string;
  walletChainId?: string;
  nonce?: string;
  message?: string;
  error?: string;
};

export type ConnectWalletParams = {
  accountId: string;
  walletAddress: string;
  chainId?: string; // Optional, defaults to eip155:0 for EOA wallets
  signature: string;
  nonce: string;
};

@Injectable()
export class DinariUserService {
  private readonly logger = new Logger(DinariUserService.name);
  private readonly CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME || "";
  private readonly CDP_API_KEY_PRIVATE_KEY =
    process.env.CDP_API_KEY_PRIVATE_KEY || "";

  constructor(
    private readonly dinari: DinariService,
    private readonly storage: DinariStorageService,
    private readonly walletService: WalletService
  ) {}

  /**
   * Complete user setup flow (automatic):
   * 1. Use entity from environment variable (DINARI_API_ENTITY_ID)
   * 2. Create new account for entity (each user gets their own account)
   * 3. Get user's growth wallet (auto-created by WalletService)
   * 4. Get wallet connection nonce from Dinari
   * 5. Sign nonce message using CDP wallet
   * 6. Connect wallet to Dinari account
   * 7. Save all info to Supabase
   *
   * This method is idempotent - if account already exists, it returns the existing account.
   */
  async setupUserAccount(userId: string): Promise<SetupDinariAccountResult> {
    try {
      // Check if user already has Dinari account with wallet connected
      const existing = await this.storage.getUserData(userId);
      if (existing?.accountId && existing?.walletAddress) {
        this.logger.log(
          `User ${userId} already has Dinari account and wallet: ${existing.accountId} / ${existing.walletAddress}`
        );
        return {
          success: true,
          entityId: existing.entityId,
          accountId: existing.accountId,
          walletAddress: existing.walletAddress,
          walletChainId: existing.chainId,
        };
      }

      // Step 1: Use entity from environment variable
      const entityId = await this.dinari.getCurrentEntity();
      if (!entityId) {
        throw new Error(
          "DINARI_API_ENTITY_ID not configured. Please set it in environment variables."
        );
      }
      this.logger.log(`Using entity from env: ${entityId}`);

      // Step 2: Create new account for entity (each user gets their own account)
      let accountId = existing?.accountId;
      if (!accountId) {
        const account = await this.dinari.createAccountForEntity(entityId);
        accountId = account.id || account.account_id;
        if (!accountId) {
          throw new Error("Failed to get account ID from Dinari response");
        }
        this.logger.log(`Created new account for user ${userId}: ${accountId}`);
      } else {
        this.logger.log(
          `Using existing account for user ${userId}: ${accountId}`
        );
      }

      // Step 3: Get user's growth wallet (auto-created by WalletService)
      const [, growthWallet] =
        await this.walletService.ensureDualWallets(userId);
      const walletAddress = toChecksumAddress(growthWallet.address);
      const chainId = "eip155:0"; // Default for EOA wallets
      this.logger.log(`Using growth wallet: ${walletAddress}`);

      // Step 4: Get wallet connection nonce from Dinari
      const nonceData = await this.dinari.getWalletConnectionNonce(
        accountId,
        walletAddress,
        chainId
      );
      this.logger.log(`Got nonce for wallet ${walletAddress}`);

      // Step 5: Sign nonce message using CDP wallet
      if (!this.CDP_API_KEY_NAME || !this.CDP_API_KEY_PRIVATE_KEY) {
        throw new Error(
          "CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be configured for automatic wallet connection"
        );
      }

      const walletProvider = await CdpWalletProvider.configureWithWallet({
        apiKeyName: this.CDP_API_KEY_NAME,
        apiKeyPrivateKey: this.CDP_API_KEY_PRIVATE_KEY,
        networkId: "base-sepolia",
        address: walletAddress,
      });

      const signature = await walletProvider.signMessage(nonceData.message);
      this.logger.log(`Signed nonce message for wallet ${walletAddress}`);

      // Step 6: Connect wallet to Dinari account
      await this.dinari.connectExternalWallet(
        accountId,
        walletAddress,
        chainId,
        signature,
        nonceData.nonce
      );
      this.logger.log(
        `Connected wallet ${walletAddress} to account ${accountId}`
      );

      // Step 7: Save all info to Supabase
      const userData: Partial<DinariUserData> & { userId: string } = {
        userId,
        entityId,
        accountId,
        walletAddress,
        chainId,
      };

      await this.storage.saveUserData(userData);

      // Step 8: Automatically request faucet (sandbox test funds)
      try {
        await this.dinari.sandboxFaucet(accountId, chainId);
        this.logger.log(
          `Automatically requested faucet for account ${accountId}`
        );
      } catch (faucetError) {
        // Log but don't fail the setup if faucet fails
        this.logger.warn(
          `Failed to request faucet for account ${accountId}: ${faucetError}`
        );
      }

      return {
        success: true,
        entityId,
        accountId,
        walletAddress,
        walletChainId: chainId,
      };
    } catch (error) {
      this.logger.error(
        `Error setting up Dinari account for user ${userId}: ${error}`
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get user's Dinari account info
   */
  async getUserAccountInfo(userId: string): Promise<DinariUserData | null> {
    return this.storage.getUserData(userId);
  }

  /**
   * Get user's chain ID with fallback
   * Returns user's chain_id if exists, otherwise defaults to eip155:0
   */
  async getUserChainId(userId: string): Promise<string> {
    const userData = await this.storage.getUserData(userId);
    return userData?.chainId || "eip155:0";
  }

  /**
   * Get user's wallet address with fallback
   * Returns user's wallet address if exists, otherwise defaults to 0xb2a3D4CC1E147f8726B1BCf9944ACe13e811C120
   */
  async getUserWalletAddress(userId: string): Promise<string> {
    const userData = await this.storage.getUserData(userId);
    return (
      userData?.walletAddress ||
      toChecksumAddress("0xb2a3D4CC1E147f8726B1BCf9944ACe13e811C120")
    );
  }

  /**
   * Get user's Dinari account balance (in USD)
   * Returns the available balance in the growth account
   */
  async getAccountBalance(userId: string): Promise<number> {
    try {
      const accountInfo = await this.getUserAccountInfo(userId);
      if (!accountInfo?.accountId) {
        // Return default balance if account not set up
        return 1000; // Default sandbox balance after faucet
      }

      // Get wallet info from Dinari API (may contain balance)
      const walletInfo = await this.dinari.getWalletForAccount(
        accountInfo.accountId
      );

      // Try to extract balance from wallet info
      // Dinari API may return balance in different formats
      if (walletInfo?.balance !== undefined) {
        return parseFloat(walletInfo.balance) || 1000;
      }
      if (walletInfo?.available_balance !== undefined) {
        return parseFloat(walletInfo.available_balance) || 1000;
      }
      if (walletInfo?.usd_balance !== undefined) {
        return parseFloat(walletInfo.usd_balance) || 1000;
      }

      // Default to 1000 USD (sandbox faucet amount)
      return 1000;
    } catch (error) {
      this.logger.warn(
        `Failed to get account balance for user ${userId}: ${error}`
      );
      // Return default balance on error
      return 1000;
    }
  }

  /**
   * Buy stock with automatic signing (simplified interface)
   * This method encapsulates all internal steps:
   * 1. Get stock by symbol
   * 2. Prepare proxied order
   * 3. Sign permit and order typed data using CDP wallet
   * 4. Create proxied order
   * 5. Return order result
   */
  async buyStock(
    userId: string,
    stockSymbol: string,
    amount: number, // USD amount
    paymentTokenAddress: string = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" // USDC on Ethereum (sandbox)
  ): Promise<any> {
    try {
      // Get user account info
      const accountInfo = await this.getUserAccountInfo(userId);
      if (!accountInfo?.accountId) {
        throw new Error(
          "Dinari account not set up. Please call /dinari/setup first."
        );
      }

      const walletAddress = await this.getUserWalletAddress(userId);
      const chainId = await this.getUserChainId(userId);

      // Step 1: Get stock by symbol
      const stock = await this.dinari.getStockBySymbol(stockSymbol);
      if (!stock) {
        throw new Error(`Stock ${stockSymbol} not found`);
      }

      // Step 2: Prepare proxied order
      const preparedOrder = await this.dinari.prepareProxiedOrder({
        accountId: accountInfo.accountId,
        chainId: chainId,
        orderTif: "DAY",
        orderSide: "BUY",
        orderType: "MARKET",
        stockId: stock.id,
        paymentToken: paymentTokenAddress,
        paymentTokenQuantity: amount, // USD amount for market buy
      });

      this.logger.log(`Prepared order for ${stockSymbol}: ${preparedOrder.id}`);

      // Step 3: Sign permit and order typed data using CDP wallet
      if (!this.CDP_API_KEY_NAME || !this.CDP_API_KEY_PRIVATE_KEY) {
        throw new Error(
          "CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be configured for automatic order signing"
        );
      }

      const walletProvider = await CdpWalletProvider.configureWithWallet({
        apiKeyName: this.CDP_API_KEY_NAME,
        apiKeyPrivateKey: this.CDP_API_KEY_PRIVATE_KEY,
        networkId: "base-sepolia",
        address: walletAddress,
      });

      // Sign permit typed data (EIP-712)
      // API may return snake_case or camelCase, handle both
      const permitTypedData =
        (preparedOrder as any).permit_typed_data ||
        preparedOrder.permitTypedData;
      const permitSignature = await walletProvider.signTypedData({
        domain: permitTypedData.domain,
        types: permitTypedData.types,
        primaryType: permitTypedData.primaryType,
        message: permitTypedData.message,
      });
      this.logger.log(`Signed permit typed data`);

      // Sign order typed data (EIP-712)
      const orderTypedData =
        (preparedOrder as any).order_typed_data || preparedOrder.orderTypedData;
      const orderSignature = await walletProvider.signTypedData({
        domain: orderTypedData.domain,
        types: orderTypedData.types,
        primaryType: orderTypedData.primaryType,
        message: orderTypedData.message,
      });
      this.logger.log(`Signed order typed data`);

      // Step 4: Create proxied order
      const orderRequest = await this.dinari.createProxiedOrder({
        accountId: accountInfo.accountId,
        preparedProxiedOrderId: preparedOrder.id,
        permitSignature: permitSignature,
        orderSignature: orderSignature,
      });

      this.logger.log(
        `Created order request for ${stockSymbol}: ${orderRequest.id}`
      );

      // Step 5: Save transaction record
      await this.storage.saveTransaction({
        userId: userId,
        accountId: accountInfo.accountId,
        orderId: orderRequest.orderId,
        stockSymbol: stockSymbol,
        orderType: "market",
        side: "buy",
        amount: amount,
        status: orderRequest.status === "SUBMITTED" ? "completed" : "pending",
      });

      return {
        success: true,
        orderRequestId: orderRequest.id,
        orderId: orderRequest.orderId,
        stockSymbol: stockSymbol,
        amount: amount,
        status: orderRequest.status,
        message: `Successfully placed order for ${amount} USD worth of ${stockSymbol}`,
      };
    } catch (error) {
      this.logger.error(`Error buying stock ${stockSymbol}: ${error}`);
      throw error;
    }
  }

  /**
   * Check if user has Dinari account setup
   * Returns true only if both accountId and walletAddress are present
   */
  async hasAccountSetup(userId: string): Promise<boolean> {
    const data = await this.storage.getUserData(userId);
    return !!(data?.accountId && data?.walletAddress);
  }

  /**
   * Check if user has Dinari account (without wallet)
   */
  async hasAccount(userId: string): Promise<boolean> {
    const data = await this.storage.getUserData(userId);
    return !!data?.accountId;
  }

  /**
   * Get wallet connection nonce for a user's account
   */
  async getWalletConnectionNonce(
    userId: string,
    walletAddress: string,
    chainId: string = "eip155:0" // eip155:0 for EOA wallets (default for user-created wallets)
  ): Promise<{ nonce: string; message: string; accountId: string }> {
    // Ensure address is in checksum format (required by Dinari API)
    const checksumAddress = toChecksumAddress(walletAddress);

    const existing = await this.storage.getUserData(userId);
    if (!existing?.accountId) {
      throw new Error(
        "User account not set up. Please call setupUserAccount first."
      );
    }

    const nonceData = await this.dinari.getWalletConnectionNonce(
      existing.accountId,
      checksumAddress,
      chainId
    );

    return {
      ...nonceData,
      accountId: existing.accountId,
    };
  }

  /**
   * Connect wallet to user's account (after user signs the nonce message)
   */
  async connectWallet(
    userId: string,
    params: ConnectWalletParams
  ): Promise<SetupDinariAccountResult> {
    try {
      const existing = await this.storage.getUserData(userId);
      if (!existing?.accountId) {
        throw new Error(
          "User account not set up. Please call setupUserAccount first."
        );
      }

      if (existing.accountId !== params.accountId) {
        throw new Error("Account ID mismatch");
      }

      // Ensure address is in checksum format (required by Dinari API)
      const checksumAddress = toChecksumAddress(params.walletAddress);

      // Default to eip155:0 for EOA wallets if chainId not provided
      const chainId = params.chainId || "eip155:0";

      // Connect wallet
      const walletData = await this.dinari.connectExternalWallet(
        params.accountId,
        checksumAddress,
        chainId,
        params.signature,
        params.nonce
      );

      // Save to Supabase (store checksum address)
      const userData: Partial<DinariUserData> & { userId: string } = {
        userId,
        entityId: existing.entityId,
        accountId: params.accountId,
        walletAddress: checksumAddress,
        chainId: chainId,
      };

      await this.storage.saveUserData(userData);

      return {
        success: true,
        entityId: existing.entityId,
        accountId: params.accountId,
        walletAddress: checksumAddress,
        walletChainId: chainId,
      };
    } catch (error) {
      this.logger.error(`Error connecting wallet: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
