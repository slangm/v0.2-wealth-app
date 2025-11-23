import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

function buildSupabaseDbUrl(supabaseUrl: string, password: string): string {
  // Extract project ref from Supabase URL
  // e.g., https://qbnmxjvatecmjyegikhr.supabase.co -> qbnmxjvatecmjyegikhr
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    return "";
  }
  const projectRef = match[1];
  // Use Supabase connection pooler (port 6543 for connection pooling)
  // Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  // Try common regions, or use direct connection
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
}

// Build database URL from Supabase URL and password
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const SUPABASE_DB_URL =
  process.env.SUPABASE_DB_URL ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.DB_PASSWORD
    ? buildSupabaseDbUrl(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.DB_PASSWORD
      )
    : "");

/**
 * Service to initialize Dinari tables on application startup
 * Automatically creates/updates tables using direct PostgreSQL connection
 */
@Injectable()
export class DinariInitService implements OnModuleInit {
  private readonly logger = new Logger(DinariInitService.name);
  private pool: Pool | null = null;

  constructor() {
    if (SUPABASE_DB_URL) {
      this.pool = new Pool({
        connectionString: SUPABASE_DB_URL,
        ssl: SUPABASE_DB_URL.includes("supabase")
          ? { rejectUnauthorized: false }
          : false,
      });
      this.logger.log("PostgreSQL pool initialized for table creation");
    } else {
      this.logger.warn(
        "SUPABASE_DB_URL not configured. Tables will not be auto-created on startup."
      );
      this.logger.warn(
        "Please run apps/api/supabase-schema.sql manually in Supabase SQL Editor"
      );
    }
  }

  async onModuleInit() {
    if (!this.pool) {
      this.logger.warn(
        "Skipping table initialization - no database connection"
      );
      return;
    }

    try {
      this.logger.log("Initializing Dinari tables...");

      // Read SQL schema file
      const schemaPath = join(process.cwd(), "apps/api/supabase-schema.sql");
      let sql: string;

      try {
        sql = readFileSync(schemaPath, "utf-8");
      } catch (error) {
        // If file doesn't exist, use inline SQL
        this.logger.warn(
          `Schema file not found at ${schemaPath}, using inline SQL`
        );
        sql = this.getInlineSchema();
      }

      // Execute SQL statements
      const client = await this.pool.connect();
      try {
        // Split by semicolon and execute each statement
        const statements = sql
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"));

        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await client.query(statement);
            } catch (err: any) {
              // Ignore "already exists" errors
              if (
                !err.message?.includes("already exists") &&
                !err.message?.includes("duplicate")
              ) {
                this.logger.warn(`SQL execution warning: ${err.message}`);
              }
            }
          }
        }

        this.logger.log("Dinari tables initialized successfully");
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(`Error initializing tables: ${error}`);
      this.logger.warn(
        "Tables may need to be created manually. Run apps/api/supabase-schema.sql in Supabase SQL Editor"
      );
    }
  }

  private getInlineSchema(): string {
    return `
      CREATE TABLE IF NOT EXISTS dinari_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL UNIQUE,
        entity_id TEXT,
        account_id TEXT,
        wallet_address TEXT,
        chain_id TEXT DEFAULT 'eip155:1',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_dinari_users_user_id ON dinari_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_dinari_users_account_id ON dinari_users(account_id);

      CREATE TABLE IF NOT EXISTS dinari_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        order_id TEXT,
        stock_symbol TEXT NOT NULL,
        order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
        side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
        amount DECIMAL(18, 2) NOT NULL,
        quantity DECIMAL(18, 8),
        price DECIMAL(18, 2),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_dinari_transactions_user_id ON dinari_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_dinari_transactions_account_id ON dinari_transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_dinari_transactions_status ON dinari_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_dinari_transactions_created_at ON dinari_transactions(created_at DESC);

      CREATE TABLE IF NOT EXISTS dinari_stocks_cache (
        symbol TEXT PRIMARY KEY,
        name TEXT,
        exchange TEXT,
        currency TEXT DEFAULT 'USD',
        current_price DECIMAL(18, 2),
        day_change_pct DECIMAL(10, 4),
        cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS update_dinari_users_updated_at ON dinari_users;
      CREATE TRIGGER update_dinari_users_updated_at
        BEFORE UPDATE ON dinari_users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_dinari_transactions_updated_at ON dinari_transactions;
      CREATE TRIGGER update_dinari_transactions_updated_at
        BEFORE UPDATE ON dinari_transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log("PostgreSQL pool closed");
    }
  }
}
