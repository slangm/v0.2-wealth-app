import { Injectable, Logger } from "@nestjs/common";
import { getAddress } from "viem";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Convert address to checksum format (required by Dinari API)
 */
function toChecksumAddress(address: string): string {
  try {
    return getAddress(address);
  } catch (error) {
    // If address is invalid, return as-is (might be null/undefined)
    return address;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export type DinariUserData = {
  userId: string;
  entityId?: string;
  accountId?: string;
  walletAddress?: string;
  chainId?: string;
  createdAt: string;
  updatedAt: string;
};

export type DinariTransaction = {
  id: string;
  userId: string;
  accountId: string;
  orderId?: string;
  stockSymbol: string;
  orderType: "market" | "limit";
  side: "buy" | "sell";
  amount: number;
  quantity?: number;
  price?: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class DinariStorageService {
  private readonly logger = new Logger(DinariStorageService.name);
  private supabase: SupabaseClient | null = null;

  constructor() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      this.logger.log("Supabase client initialized");
    } else {
      this.logger.warn("Supabase credentials not configured, storage disabled");
    }
  }

  /**
   * Get or create Dinari user data
   */
  async getUserData(userId: string): Promise<DinariUserData | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from("dinari_users")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error
        this.logger.error(`Error fetching user data: ${error.message}`);
        return null;
      }

      if (!data) return null;

      // Map snake_case to camelCase and ensure wallet address is checksum format
      return {
        userId: data.user_id,
        entityId: data.entity_id,
        accountId: data.account_id,
        walletAddress: data.wallet_address
          ? toChecksumAddress(data.wallet_address)
          : undefined,
        chainId: data.chain_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error in getUserData: ${error}`);
      return null;
    }
  }

  /**
   * Save or update Dinari user data
   */
  async saveUserData(
    data: Partial<DinariUserData> & { userId: string }
  ): Promise<DinariUserData | null> {
    if (!this.supabase) return null;

    try {
      const now = new Date().toISOString();
      // Map camelCase to snake_case for Supabase
      const record: any = {
        user_id: data.userId,
        updated_at: now,
      };

      if (data.entityId !== undefined) record.entity_id = data.entityId;
      if (data.accountId !== undefined) record.account_id = data.accountId;
      if (data.walletAddress !== undefined)
        // Ensure wallet address is stored in checksum format
        record.wallet_address = toChecksumAddress(data.walletAddress);
      if (data.chainId !== undefined) record.chain_id = data.chainId;
      if (data.createdAt) record.created_at = data.createdAt;
      else record.created_at = now;

      const { data: result, error } = await this.supabase
        .from("dinari_users")
        .upsert(record, { onConflict: "user_id" })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error saving user data: ${error.message}`);
        return null;
      }

      // Map back to camelCase and ensure wallet address is checksum format
      return {
        userId: result.user_id,
        entityId: result.entity_id,
        accountId: result.account_id,
        walletAddress: result.wallet_address
          ? toChecksumAddress(result.wallet_address)
          : undefined,
        chainId: result.chain_id,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error in saveUserData: ${error}`);
      return null;
    }
  }

  /**
   * Save transaction record
   */
  async saveTransaction(
    transaction: Omit<DinariTransaction, "id" | "createdAt" | "updatedAt">
  ): Promise<DinariTransaction | null> {
    if (!this.supabase) return null;

    try {
      const now = new Date().toISOString();
      // Map camelCase to snake_case for Supabase
      const record: any = {
        user_id: transaction.userId,
        account_id: transaction.accountId,
        stock_symbol: transaction.stockSymbol,
        order_type: transaction.orderType,
        side: transaction.side,
        amount: transaction.amount,
        status: transaction.status,
        created_at: now,
        updated_at: now,
      };

      if (transaction.orderId) record.order_id = transaction.orderId;
      if (transaction.quantity !== undefined)
        record.quantity = transaction.quantity;
      if (transaction.price !== undefined) record.price = transaction.price;

      const { data, error } = await this.supabase
        .from("dinari_transactions")
        .insert(record)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error saving transaction: ${error.message}`);
        return null;
      }

      // Map back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        accountId: data.account_id,
        orderId: data.order_id,
        stockSymbol: data.stock_symbol,
        orderType: data.order_type,
        side: data.side,
        amount: parseFloat(data.amount),
        quantity: data.quantity ? parseFloat(data.quantity) : undefined,
        price: data.price ? parseFloat(data.price) : undefined,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error in saveTransaction: ${error}`);
      return null;
    }
  }

  /**
   * Get user transactions
   */
  async getUserTransactions(
    userId: string,
    limit: number = 50
  ): Promise<DinariTransaction[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from("dinari_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        this.logger.error(`Error fetching transactions: ${error.message}`);
        return [];
      }

      // Map snake_case to camelCase
      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        accountId: row.account_id,
        orderId: row.order_id,
        stockSymbol: row.stock_symbol,
        orderType: row.order_type,
        side: row.side,
        amount: parseFloat(row.amount),
        quantity: row.quantity ? parseFloat(row.quantity) : undefined,
        price: row.price ? parseFloat(row.price) : undefined,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      this.logger.error(`Error in getUserTransactions: ${error}`);
      return [];
    }
  }
}
