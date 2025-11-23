-- Dinari Integration Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Table: dinari_users
-- Stores Dinari account and wallet information for each user
CREATE TABLE IF NOT EXISTS dinari_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- References your app's user ID
  entity_id TEXT, -- Dinari entity ID
  account_id TEXT, -- Dinari account ID
  wallet_address TEXT, -- External wallet address
  chain_id TEXT DEFAULT 'eip155:1', -- Chain ID (e.g., eip155:1 for Ethereum mainnet)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: dinari_transactions
-- Stores all Dinari stock trading transactions
CREATE TABLE IF NOT EXISTS dinari_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- References your app's user ID
  account_id TEXT NOT NULL, -- Dinari account ID
  order_id TEXT, -- Dinari order ID (if available)
  stock_symbol TEXT NOT NULL, -- Stock symbol (e.g., AAPL, TSLA)
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  amount DECIMAL(18, 2) NOT NULL, -- USD amount
  quantity DECIMAL(18, 8), -- Number of shares (if available)
  price DECIMAL(18, 2), -- Execution price (if available)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: dinari_stocks_cache
-- Cache for Dinari stock data to reduce API calls
CREATE TABLE IF NOT EXISTS dinari_stocks_cache (
  symbol TEXT PRIMARY KEY,
  name TEXT,
  exchange TEXT,
  currency TEXT DEFAULT 'USD',
  current_price DECIMAL(18, 2),
  day_change_pct DECIMAL(10, 4),
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dinari_users_user_id ON dinari_users(user_id);
CREATE INDEX IF NOT EXISTS idx_dinari_users_account_id ON dinari_users(account_id);
CREATE INDEX IF NOT EXISTS idx_dinari_transactions_user_id ON dinari_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_dinari_transactions_account_id ON dinari_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_dinari_transactions_status ON dinari_transactions(status);
CREATE INDEX IF NOT EXISTS idx_dinari_transactions_created_at ON dinari_transactions(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_dinari_users_updated_at
  BEFORE UPDATE ON dinari_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dinari_transactions_updated_at
  BEFORE UPDATE ON dinari_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS
ALTER TABLE dinari_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinari_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own dinari data"
  ON dinari_users
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own dinari data"
  ON dinari_users
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own dinari data"
  ON dinari_users
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own transactions"
  ON dinari_transactions
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own transactions"
  ON dinari_transactions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Note: If you're not using Supabase Auth, you may need to adjust RLS policies
-- or disable RLS and handle authorization in your application layer

