CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS allowed_system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  os_type TEXT DEFAULT 'windows',
  is_allowed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  api_key_hash TEXT,
  api_key_prefix TEXT,
  auth_provider TEXT DEFAULT 'native',
  external_id TEXT,
  credits_balance BIGINT DEFAULT 0,
  credits_used BIGINT DEFAULT 0,
  low_threshold BIGINT DEFAULT 100000,
  plan TEXT DEFAULT 'payg',
  webhook_url TEXT,
  webhook_secret TEXT,
  daily_requests_count INT DEFAULT 0,
  last_request_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_merchants_prefix ON merchants(api_key_prefix);

CREATE TABLE IF NOT EXISTS merchant_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  credentials_encrypted BYTEA NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, provider)
);

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  idempotency_key TEXT,
  provider TEXT NOT NULL,
  amount NUMERIC(18,6) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  provider_reference TEXT,
  provider_response JSONB,
  cost_microcents BIGINT DEFAULT 0,
  cpu_us BIGINT DEFAULT 0,
  memory_mb INT DEFAULT 0,
  is_free_tier BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_payreq_merchant ON payment_requests(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payreq_ref ON payment_requests(provider_reference);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  delta BIGINT NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  balance_after BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_merchant ON credit_ledger(merchant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL,
  signature_valid BOOLEAN,
  forwarded BOOLEAN DEFAULT FALSE,
  forward_status_code INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  provider TEXT NOT NULL,
  priority INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doc_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doc_embedding ON doc_chunks USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  merchant_id UUID,
  action TEXT NOT NULL,
  ip INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
