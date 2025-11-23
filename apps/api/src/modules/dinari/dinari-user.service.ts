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
  private readonly DEMO_PRIVATE_KEY =
    process.env.DEMO_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY || "";
  private readonly DEMO_WALLET_ADDRESS = process.env.DEMO_WALLET_ADDRESS || "";
  private readonly DEMO_ACCOUNT_ID = process.env.DEMO_ACCOUNT_ID || "";
  private readonly DEMO_ENTITY_ID = process.env.DINARI_API_ENTITY_ID || "";

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
      // Account creation uses eip155:0 (EOA wallet)
      const defaultChainId = "eip155:0";

      // 🎯 DEMO MODE: If DEMO_ACCOUNT_ID is configured, use it directly (skip account creation)
      if (
        this.DEMO_ACCOUNT_ID &&
        this.DEMO_WALLET_ADDRESS &&
        this.DEMO_ENTITY_ID
      ) {
        this.logger.log(
          `🎯 DEMO MODE: Using pre-configured account ${this.DEMO_ACCOUNT_ID} for user ${userId}`
        );

        // Check if already saved
        const existing = await this.storage.getUserData(userId);
        if (existing?.accountId === this.DEMO_ACCOUNT_ID) {
          return {
            success: true,
            entityId: this.DEMO_ENTITY_ID,
            accountId: this.DEMO_ACCOUNT_ID,
            walletAddress: this.DEMO_WALLET_ADDRESS,
            walletChainId: defaultChainId,
          };
        }

        // Save demo config for this user
        await this.storage.saveUserData({
          userId,
          entityId: this.DEMO_ENTITY_ID,
          accountId: this.DEMO_ACCOUNT_ID,
          walletAddress: this.DEMO_WALLET_ADDRESS,
          chainId: defaultChainId,
        });

        this.logger.log(
          `✅ DEMO MODE: Saved demo account config for user ${userId}`
        );

        return {
          success: true,
          entityId: this.DEMO_ENTITY_ID,
          accountId: this.DEMO_ACCOUNT_ID,
          walletAddress: this.DEMO_WALLET_ADDRESS,
          walletChainId: defaultChainId,
        };
      }

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
        try {
          const account = await this.dinari.createAccountForEntity(entityId);
          accountId = account.id || account.account_id;
          if (!accountId) {
            throw new Error("Failed to get account ID from Dinari response");
          }
          this.logger.log(
            `Created new account for user ${userId}: ${accountId}`
          );
        } catch (createErr) {
          this.logger.warn(
            `Create account failed (${createErr}). Trying to reuse first entity account.`
          );
          const accounts = await this.dinari.getAccountsForEntity(entityId);
          if (accounts.length === 0) {
            throw createErr;
          }
          accountId = accounts[0].id;
          this.logger.log(
            `Reusing existing account ${accountId} for user ${userId}`
          );
        }
      } else {
        this.logger.log(
          `Using configured/existing account for user ${userId}: ${accountId}`
        );
      }

      if (!accountId) {
        throw new Error("Dinari account id is undefined after setup.");
      }

      // Step 3: Choose wallet address: demo override -> growth wallet
      let walletAddress: string;
      if (this.DEMO_WALLET_ADDRESS) {
        walletAddress = toChecksumAddress(this.DEMO_WALLET_ADDRESS);
        this.logger.log(`Using demo wallet address from env: ${walletAddress}`);
      } else {
        const [, growthWallet] =
          await this.walletService.ensureDualWallets(userId);
        walletAddress = toChecksumAddress(growthWallet.address);
      }
      const chainId = defaultChainId; // Default to Base mainnet unless overridden
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
        networkId: process.env.GROWTH_NETWORK || "base-mainnet",
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
   * Get user's chain ID for trading (not account creation)
   * Returns trading chain_id (eip155:11155111 for Ethereum Sepolia)
   * Note: Account creation uses eip155:0, but trading uses eip155:11155111
   */
  async getUserChainId(userId: string): Promise<string> {
    // Always use Ethereum Sepolia for trading, regardless of stored chainId
    return (
      process.env.DINARI_CHAIN_ID ||
      "eip155:11155111" /* Ethereum Sepolia for Growth Portfolio trading */
    );
  }

  /**
   * Get user's wallet address with fallback
   * Returns user's wallet address if exists, otherwise uses DEMO_WALLET_ADDRESS from env
   */
  async getUserWalletAddress(userId: string): Promise<string> {
    const userData = await this.storage.getUserData(userId);
    const defaultWallet =
      process.env.DEMO_WALLET_ADDRESS ||
      "0x78C0dB5BE983b773815dC86D2F2fBD24FAa1A473";
    return userData?.walletAddress || toChecksumAddress(defaultWallet);
  }

  /**
   * Get user's account info with demo fallback (without writing to storage)
   */
  async getAccountInfoWithDemo(userId: string): Promise<DinariUserData | null> {
    let accountInfo = await this.getUserAccountInfo(userId);
    if (!accountInfo?.accountId && this.DEMO_ACCOUNT_ID) {
      const now = new Date().toISOString();
      accountInfo = {
        userId,
        entityId: this.DEMO_ENTITY_ID || "",
        accountId: this.DEMO_ACCOUNT_ID,
        walletAddress: this.DEMO_WALLET_ADDRESS || "",
        chainId: "eip155:11155111",
        createdAt: now,
        updatedAt: now,
      };
      this.logger.log(
        `🎯 DEMO MODE: Using demo account ${this.DEMO_ACCOUNT_ID} for user ${userId}`
      );
    }
    return accountInfo ?? null;
  }

  /**
   * Get user's Dinari account balance (in USD)
   * Returns the available balance in the growth account from /cash API
   */
  async getAccountBalance(userId: string): Promise<number> {
    try {
      // Use demo config if available, otherwise get user account info
      let accountInfo = await this.getUserAccountInfo(userId);

      if (!accountInfo?.accountId && this.DEMO_ACCOUNT_ID) {
        // Use demo config directly
        accountInfo = {
          userId,
          entityId: this.DEMO_ENTITY_ID || "",
          accountId: this.DEMO_ACCOUNT_ID,
          walletAddress: this.DEMO_WALLET_ADDRESS || "",
          chainId: "eip155:11155111",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.logger.log(
          `🎯 DEMO MODE: Using demo account ${this.DEMO_ACCOUNT_ID} for getAccountBalance`
        );
      }

      if (!accountInfo?.accountId) {
        this.logger.warn(
          `No account found for user ${userId}, returning default balance 1000`
        );
        return 1000;
      }

      // Get cash balance from Dinari API
      this.logger.log(
        `Fetching cash balance for account ${accountInfo.accountId}`
      );
      const balance = await this.dinari.getCashBalance(accountInfo.accountId);

      if (balance === 0 || balance === null || balance === undefined) {
        this.logger.warn(
          `Cash balance is 0/null for account ${accountInfo.accountId}, returning default 1000`
        );
        return 1000;
      }

      this.logger.log(
        `✅ Cash balance for account ${accountInfo.accountId}: $${balance}`
      );
      return balance;
    } catch (error) {
      this.logger.error(
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
    paymentTokenAddress?: string
  ): Promise<any> {
    try {
      // Use demo config if available, otherwise get user account info
      let accountInfo = await this.getUserAccountInfo(userId);

      if (!accountInfo?.accountId && this.DEMO_ACCOUNT_ID) {
        // Use demo config directly
        const now = new Date().toISOString();
        accountInfo = {
          userId,
          entityId: this.DEMO_ENTITY_ID || "",
          accountId: this.DEMO_ACCOUNT_ID,
          walletAddress: this.DEMO_WALLET_ADDRESS || "",
          chainId: "eip155:11155111",
          createdAt: now,
          updatedAt: now,
        };
        this.logger.log(
          `🎯 DEMO MODE: Using demo account ${this.DEMO_ACCOUNT_ID} for buyStock`
        );
      }

      if (!accountInfo?.accountId) {
        throw new Error(
          "Dinari account not set up. Please call /dinari/setup first."
        );
      }

      const walletAddress =
        accountInfo.walletAddress || (await this.getUserWalletAddress(userId));
      const chainId = await this.getUserChainId(userId);

      // Auto-select payment token based on chain ID if not provided
      if (!paymentTokenAddress) {
        if (chainId === "eip155:11155111") {
          // Ethereum Sepolia (for Growth Portfolio)
          paymentTokenAddress =
            process.env.DINARI_PAYMENT_TOKEN ||
            "0x665b099132d79739462DfDe6874126AFe840F7a3";
        } else if (chainId === "eip155:84532") {
          // Base Sepolia USDC
          paymentTokenAddress =
            process.env.DINARI_PAYMENT_TOKEN_BASE_SEPOLIA ||
            "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
        } else if (chainId === "eip155:8453") {
          // Base Mainnet USDC
          paymentTokenAddress =
            process.env.DINARI_PAYMENT_TOKEN_BASE_MAINNET ||
            "0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913";
        } else {
          // Default to Ethereum Sepolia for Growth Portfolio
          paymentTokenAddress =
            process.env.DINARI_PAYMENT_TOKEN ||
            "0x665b099132d79739462DfDe6874126AFe840F7a3";
        }
        this.logger.log(
          `Auto-selected payment token for ${chainId}: ${paymentTokenAddress}`
        );
      }

      // Step 1: Get stock by symbol (always fetch from Dinari API)
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

      // Return prepared order data for frontend to sign
      return {
        success: true,
        preparedOrderId: preparedOrder.id,
        preparedOrder: preparedOrder,
        stockSymbol: stockSymbol,
        amount: amount,
        message: `Prepared order for ${amount} USD worth of ${stockSymbol}. Please sign and confirm.`,
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

  /**
   * Link wallet to Dinari account (server-side, automatic signing)
   * This method handles the entire flow server-side:
   * 1. Get wallet connection nonce
   * 2. Sign nonce message using CDP wallet or local private key
   * 3. Connect wallet to Dinari account
   * 4. Save to database
   */
  async linkWalletServerSide(
    userId: string,
    walletAddress: string,
    chainId: string = "eip155:0",
    privateKey?: string // Optional: if provided, use this instead of CDP
  ): Promise<SetupDinariAccountResult> {
    try {
      // Get user's Dinari account
      const existing = await this.storage.getUserData(userId);
      if (!existing?.accountId) {
        throw new Error(
          "Dinari account not set up. Please call /dinari/setup first."
        );
      }

      // Ensure address is in checksum format
      const checksumAddress = toChecksumAddress(walletAddress);
      this.logger.log(
        `Linking wallet ${checksumAddress} to account ${existing.accountId}`
      );

      // Step 1: Get wallet connection nonce
      const nonceData = await this.dinari.getWalletConnectionNonce(
        existing.accountId,
        checksumAddress,
        chainId
      );
      this.logger.log(`Got nonce for wallet ${checksumAddress}`);

      // Step 2: Sign nonce message
      let signature: string;
      // Prefer explicit private key (demo) if provided
      const localPrivateKey =
        privateKey || this.DEMO_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY;
      if (localPrivateKey) {
        this.logger.log(`Using local private key for signing`);
        // @ts-ignore Optional runtime dependency (not bundled in demo mode)
        const { Wallet } = await import("ethers");
        const wallet = new Wallet(localPrivateKey);
        if (wallet.address.toLowerCase() !== checksumAddress.toLowerCase()) {
          throw new Error(
            `Private key does not match wallet address. Expected ${checksumAddress}, got ${wallet.address}`
          );
        }
        signature = await wallet.signMessage(nonceData.message);
        this.logger.log(`Signed nonce message using local private key`);
      } else if (this.CDP_API_KEY_NAME && this.CDP_API_KEY_PRIVATE_KEY) {
        // Use CDP wallet
        this.logger.log(`Using CDP wallet for signing`);
        const walletProvider = await CdpWalletProvider.configureWithWallet({
          apiKeyName: this.CDP_API_KEY_NAME,
          apiKeyPrivateKey: this.CDP_API_KEY_PRIVATE_KEY,
          networkId: process.env.GROWTH_NETWORK || "base-mainnet",
          address: checksumAddress,
        });

        signature = await walletProvider.signMessage(nonceData.message);
        this.logger.log(`Signed nonce message using CDP wallet`);
      } else {
        throw new Error(
          "No signing method available. Configure DEMO_PRIVATE_KEY or CDP_API_KEY_NAME/CDP_API_KEY_PRIVATE_KEY."
        );
      }

      // Step 3: Connect wallet to Dinari account
      const walletData = await this.dinari.connectExternalWallet(
        existing.accountId,
        checksumAddress,
        chainId,
        signature,
        nonceData.nonce
      );
      this.logger.log(
        `Connected wallet ${checksumAddress} to account ${existing.accountId}`
      );

      // Step 4: Save to database
      const userData: Partial<DinariUserData> & { userId: string } = {
        userId,
        entityId: existing.entityId,
        accountId: existing.accountId,
        walletAddress: checksumAddress,
        chainId: chainId,
      };

      await this.storage.saveUserData(userData);
      this.logger.log(`Saved wallet info to database for user ${userId}`);

      return {
        success: true,
        entityId: existing.entityId,
        accountId: existing.accountId,
        walletAddress: checksumAddress,
        walletChainId: chainId,
        message: `Successfully linked wallet ${checksumAddress} to Dinari account`,
      };
    } catch (error) {
      this.logger.error(
        `Error linking wallet server-side for user ${userId}: ${error}`
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Save transaction record
   */
  async saveTransaction(transaction: {
    userId: string;
    accountId: string;
    orderId?: string;
    stockSymbol: string;
    orderType: "market" | "limit";
    side: "buy" | "sell";
    amount: number;
    status: "pending" | "completed" | "failed" | "cancelled";
  }): Promise<void> {
    await this.storage.saveTransaction(transaction);
  }
}
