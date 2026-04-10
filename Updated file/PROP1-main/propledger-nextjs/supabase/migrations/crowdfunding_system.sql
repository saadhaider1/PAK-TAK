-- ============================================================
--  PropLedger Crowdfunding System — Supabase SQL Migration
--  Run this in: Supabase Dashboard → SQL Editor
--  (Run AFTER investment_system.sql — shares the restrictions table)
-- ============================================================

-- Crowdfunding Requests (pending admin approval)
CREATE TABLE IF NOT EXISTS crowdfunding_requests (
    id               BIGSERIAL PRIMARY KEY,
    user_id          UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id      BIGINT        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    campaign_title   TEXT,
    user_name        TEXT,
    user_email       TEXT,
    amount           NUMERIC(15,2) NOT NULL,
    admin_set_amount NUMERIC(15,2),           -- admin can override contribution amount
    status           TEXT          NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending','approved','rejected')),
    admin_note       TEXT,
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cf_req_user     ON crowdfunding_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cf_req_status   ON crowdfunding_requests(status);
CREATE INDEX IF NOT EXISTS idx_cf_req_campaign ON crowdfunding_requests(campaign_id);

-- Enable RLS
ALTER TABLE crowdfunding_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own requests
CREATE POLICY "Users read own crowdfunding requests"
    ON crowdfunding_requests FOR SELECT
    USING (auth.uid() = user_id);

-- NOTE: user_investment_restrictions table is SHARED between
-- investment_requests and crowdfunding_requests — already created
-- by investment_system.sql. No need to recreate it.

-- ============================================================
--  Verify
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('crowdfunding_requests', 'investment_requests', 'user_investment_restrictions', 'admin_notifications');
