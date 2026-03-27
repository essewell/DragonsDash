-- ============================================================
-- DragonsDash — Database Schema
-- ============================================================
-- PostgreSQL schema for the server-side encrypted blob store.
-- The server NEVER decrypts user data — it stores opaque blobs.
-- Client-side uses SQLite (via sql.js or wa-sqlite in WASM).
-- This schema mirrors the client-side data model.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ACCOUNTS (Container level)
-- ============================================================
CREATE TABLE accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(20) NOT NULL CHECK (type IN (
                    'chequing', 'savings', 'hisa', 'cash',
                    'tfsa', 'rrsp', 'fhsa', 'resp', 'nonregistered',
                    'crypto', 'credit_card', 'loan', 'recurring'
                  )),
  currency        CHAR(3) NOT NULL DEFAULT 'CAD',
  institution     VARCHAR(255),
  -- RRSP-specific
  rrsp_deduction_limit    DECIMAL(12,2),
  -- FHSA-specific: cumulative contributions toward $40,000 lifetime cap
  fhsa_cumulative_contributions DECIMAL(12,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);

-- ============================================================
-- SUB-ACCOUNTS (Individual holdings under a container)
-- ============================================================
CREATE TABLE sub_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  institution     VARCHAR(255),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_accounts_account_id ON sub_accounts(account_id);

-- ============================================================
-- CATEGORIES (User-editable taxonomy)
-- ============================================================
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon            VARCHAR(50),
  color           VARCHAR(7), -- hex color
  is_system       BOOLEAN NOT NULL DEFAULT FALSE,
  budget_monthly  DECIMAL(12,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id        UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  type                  VARCHAR(20) NOT NULL CHECK (type IN (
                          'income', 'expense', 'transfer',
                          'investment_buy', 'investment_sell'
                        )),
  amount                DECIMAL(14,2) NOT NULL,
  currency              CHAR(3) NOT NULL DEFAULT 'CAD',
  merchant              VARCHAR(255) NOT NULL DEFAULT '',
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  date                  DATE NOT NULL,
  memo                  TEXT,
  tags                  TEXT[] DEFAULT '{}',
  receipt_url           TEXT, -- encrypted reference
  -- For transfers: zero-sum double-entry pair
  linked_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  -- For split transactions
  is_split              BOOLEAN NOT NULL DEFAULT FALSE,
  split_parent_id       UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_sub_account_id ON transactions(sub_account_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_merchant ON transactions(merchant);
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);

-- ============================================================
-- HOLDINGS (Securities, crypto, assets within sub-accounts)
-- ============================================================
CREATE TABLE holdings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id    UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  asset_type        VARCHAR(10) NOT NULL CHECK (asset_type IN (
                      'stock', 'etf', 'bond', 'crypto', 'cash'
                    )),
  symbol            VARCHAR(20) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  quantity          DECIMAL(18,8) NOT NULL,
  cost_basis_per_unit DECIMAL(14,4) NOT NULL,
  total_cost_basis  DECIMAL(14,2) NOT NULL,
  purchase_date     DATE NOT NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'CAD',
  -- Crypto-specific
  storage_type      VARCHAR(10) CHECK (storage_type IN ('hot', 'cold', 'hardware')),
  public_address    VARCHAR(255), -- read-only, no private keys
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_holdings_sub_account_id ON holdings(sub_account_id);
CREATE INDEX idx_holdings_symbol ON holdings(symbol);

-- ============================================================
-- RECURRING BILLS
-- ============================================================
CREATE TABLE recurring_bills (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  amount              DECIMAL(12,2), -- NULL for variable bills
  estimated_amount    DECIMAL(12,2),
  currency            CHAR(3) NOT NULL DEFAULT 'CAD',
  due_day_of_month    INTEGER NOT NULL CHECK (due_day_of_month BETWEEN 1 AND 31),
  payment_account_id  UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_variable         BOOLEAN NOT NULL DEFAULT FALSE,
  last_paid_date      DATE,
  last_paid_amount    DECIMAL(12,2),
  renewal_date        DATE, -- for annual subscriptions
  card_on_file        VARCHAR(4), -- last 4 digits only
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_bills_user_id ON recurring_bills(user_id);

-- ============================================================
-- WATCHLIST
-- ============================================================
CREATE TABLE watchlist_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol          VARCHAR(20) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  asset_type      VARCHAR(10) NOT NULL CHECK (asset_type IN (
                    'stock', 'etf', 'bond', 'crypto', 'cash'
                  )),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watchlist_user_id ON watchlist_items(user_id);

-- ============================================================
-- MARKET DATA CACHE (server-side, non-user-specific)
-- ============================================================
CREATE TABLE market_cache (
  symbol          VARCHAR(20) PRIMARY KEY,
  price           DECIMAL(14,4) NOT NULL,
  change_amount   DECIMAL(14,4),
  change_percent  DECIMAL(8,4),
  volume          BIGINT,
  market_cap      BIGINT,
  recency         VARCHAR(20) NOT NULL CHECK (recency IN (
                    'realtime', 'delayed_15min', 'delayed_20min', 'last_known'
                  )),
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ECONOMIC INDICATORS CACHE
-- ============================================================
CREATE TABLE economic_indicators (
  id                  VARCHAR(50) PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  value               DECIMAL(12,4) NOT NULL,
  unit                VARCHAR(20) NOT NULL,
  source              VARCHAR(255) NOT NULL,
  source_url          TEXT,
  last_updated        TIMESTAMPTZ NOT NULL,
  next_decision_date  DATE,
  trend_90d           JSONB, -- array of numbers for sparkline
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS (minimal — zero-knowledge)
-- ============================================================
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- WebAuthn
  webauthn_credential_id  TEXT,
  webauthn_public_key     TEXT,
  webauthn_counter        BIGINT DEFAULT 0,
  -- PIN fallback (hashed client-side before transmission)
  pin_hash                TEXT,
  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at         TIMESTAMPTZ,
  failed_attempts   INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- ENCRYPTED SYNC BLOBS (server stores opaque encrypted data)
-- ============================================================
CREATE TABLE encrypted_blobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blob_type   VARCHAR(50) NOT NULL, -- e.g. 'accounts', 'transactions', 'preferences'
  ciphertext  TEXT NOT NULL, -- base64 encoded encrypted data
  nonce       TEXT NOT NULL, -- base64 encoded nonce
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_encrypted_blobs_user_type ON encrypted_blobs(user_id, blob_type);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sub_accounts_updated_at BEFORE UPDATE ON sub_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_holdings_updated_at BEFORE UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_recurring_bills_updated_at BEFORE UPDATE ON recurring_bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_encrypted_blobs_updated_at BEFORE UPDATE ON encrypted_blobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
