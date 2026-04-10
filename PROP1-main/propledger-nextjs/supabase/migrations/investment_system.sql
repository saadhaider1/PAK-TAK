-- ============================================================
--  PropLedger Investment System — Supabase SQL Migration
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Investment Requests (pending admin approval)
CREATE TABLE IF NOT EXISTS investment_requests (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id     BIGINT        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    property_title  TEXT,
    user_name       TEXT,
    user_email      TEXT,
    amount          NUMERIC(15,2) NOT NULL,
    admin_set_amount NUMERIC(15,2),          -- admin can override/set a custom total
    status          TEXT          NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','approved','rejected')),
    admin_note      TEXT,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_inv_req_user    ON investment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_req_status  ON investment_requests(status);
CREATE INDEX IF NOT EXISTS idx_inv_req_prop    ON investment_requests(property_id);

-- 2. User Investment Restrictions
CREATE TABLE IF NOT EXISTS user_investment_restrictions (
    id             BIGSERIAL PRIMARY KEY,
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    reason         TEXT,
    is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    restricted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uir_user   ON user_investment_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_uir_active ON user_investment_restrictions(is_active);

-- 3. Admin Notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id            BIGSERIAL PRIMARY KEY,
    type          TEXT        NOT NULL,   -- e.g. 'investment_request', 'agent_signup'
    title         TEXT        NOT NULL,
    message       TEXT        NOT NULL,
    reference_id  TEXT,                   -- ID of the related record
    is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_read ON admin_notifications(is_read);

-- 4. RLS Policies (keep data safe)
-- Only service_role can write; anon cannot read private tables
ALTER TABLE investment_requests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_investment_restrictions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications           ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — API routes use the service key, so no extra policies needed.
-- Optional: allow authenticated users to read their own requests
CREATE POLICY "Users read own investment requests"
    ON investment_requests FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
--  Verify
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('investment_requests','user_investment_restrictions','admin_notifications');
