-- Add password_hash column to users table for custom authentication
-- (Users created via Supabase Auth won't use this, but custom signup users will)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Password Reset Table
CREATE TABLE IF NOT EXISTS public.password_resets (
    email VARCHAR(255) NOT NULL PRIMARY KEY,
    token VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON public.password_resets(expires_at);

-- Enable RLS
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage password resets (for API routes)
CREATE POLICY "Service role can manage password resets" ON public.password_resets
    FOR ALL USING (true);
